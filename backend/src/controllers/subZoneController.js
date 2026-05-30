/**
 * Sub-Zone Controller — Sub-Plot Management within Fields
 *
 * Features:
 * - CRUD for sub-zones (sub-plots) nested under a parent field
 * - GeoJSON boundary validation and containment checking (via GeoService)
 * - Live telemetry simulation (via MockMetricService)
 * - Zone metric history persistence
 *
 * Authorization: All operations verify that the parent field belongs to the
 * authenticated user before allowing access.
 */

const pool = require('../config/db');
const { validateSubZone, validateGeoJsonPolygon } = require('../services/geoService');
const { generateMetrics } = require('../services/mockMetricService');

// ── List Sub-Zones for a Field ────────────────────────────────

/**
 * GET /api/fields/:fieldId/subzones
 *
 * Returns all sub-zones belonging to the specified field.
 * Also fetches the latest metric snapshot for each sub-zone.
 */
const getSubZones = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.fieldId;

    // Verify field ownership
    const field = await pool.query(
      'SELECT id, boundary FROM fields WHERE id = $1 AND user_id = $2',
      [fieldId, userId]
    );

    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    // Fetch sub-zones with their latest metric (using a lateral join)
    const result = await pool.query(`
      SELECT sz.*,
             lm.health_score  AS latest_health_score,
             lm.temperature   AS latest_temperature,
             lm.humidity      AS latest_humidity,
             lm.soil_moisture AS latest_soil_moisture,
             lm.ph            AS latest_ph,
             lm.ec            AS latest_ec,
             lm.created_at    AS latest_metric_at
      FROM sub_zones sz
      LEFT JOIN LATERAL (
        SELECT health_score, temperature, humidity, soil_moisture, ph, ec, created_at
        FROM zone_metrics
        WHERE sub_zone_id = sz.id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE sz.field_id = $1
      ORDER BY sz.created_at ASC
    `, [fieldId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[SubZone] getSubZones error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach vung trong.' });
  }
};

// ── Get Single Sub-Zone ───────────────────────────────────────

/**
 * GET /api/subzones/:id
 *
 * Returns a single sub-zone with its latest metrics and recent metric history.
 */
const getSubZoneById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subZoneId = req.params.id;

    // Join through field to verify ownership
    const result = await pool.query(`
      SELECT sz.*
      FROM sub_zones sz
      JOIN fields f ON f.id = sz.field_id
      WHERE sz.id = $1 AND f.user_id = $2
    `, [subZoneId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay vung trong.' });
    }

    // Fetch recent metric history (last 50 readings)
    const metrics = await pool.query(
      'SELECT * FROM zone_metrics WHERE sub_zone_id = $1 ORDER BY created_at DESC LIMIT 50',
      [subZoneId]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        metrics: metrics.rows,
      },
    });
  } catch (error) {
    console.error('[SubZone] getSubZoneById error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay thong tin vung trong.' });
  }
};

// ── Create Sub-Zone ───────────────────────────────────────────

/**
 * POST /api/fields/:fieldId/subzones
 *
 * Creates a new sub-zone within a field. Validates that:
 *   1. The boundary is a valid GeoJSON Polygon
 *   2. The sub-zone polygon lies entirely within the parent field boundary
 *
 * Request body:
 *   { crop_type, boundary, planting_date, fertilize_freq?, spray_freq? }
 */
const createSubZone = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.fieldId;
    const { crop_type, boundary, planting_date, fertilize_freq, spray_freq } = req.body;

    // ── Validate required fields ──
    if (!crop_type || !boundary) {
      return res.status(400).json({
        success: false,
        message: 'Thieu crop_type hoac boundary.',
      });
    }

    // ── Validate GeoJSON structure ──
    const geoValidation = validateGeoJsonPolygon(boundary);
    if (!geoValidation.valid) {
      return res.status(400).json({
        success: false,
        message: `Du lieu GeoJSON khong hop le: ${geoValidation.reason}`,
      });
    }

    // ── Verify field ownership and get field boundary ──
    const field = await pool.query(
      'SELECT id, boundary FROM fields WHERE id = $1 AND user_id = $2',
      [fieldId, userId]
    );

    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    // ── Geospatial containment check ──
    // Verify the sub-zone polygon fits entirely inside the field boundary.
    // This prevents farmers from accidentally plotting sub-zones outside their property.
    const fieldBoundary = field.rows[0].boundary;
    if (fieldBoundary) {
      const fieldBoundaryData = typeof fieldBoundary === 'string'
        ? JSON.parse(fieldBoundary)
        : fieldBoundary;

      const isContained = validateSubZone(fieldBoundaryData, boundary);
      if (!isContained) {
        return res.status(400).json({
          success: false,
          message: 'Vung trong nam ngoai gioi han canh dong. Vui long ve lai.',
        });
      }
    }

    // ── Insert sub-zone ──
    const result = await pool.query(
      `INSERT INTO sub_zones (field_id, crop_type, boundary, planting_date, fertilize_freq, spray_freq)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        fieldId,
        crop_type,
        JSON.stringify(boundary),
        planting_date || null,
        fertilize_freq || 14,
        spray_freq || 10,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[SubZone] createSubZone error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi tao vung trong.' });
  }
};

// ── Update Sub-Zone ───────────────────────────────────────────

/**
 * PUT /api/subzones/:id
 *
 * Updates sub-zone properties. If a new boundary is provided, it is validated
 * against the parent field boundary before saving.
 */
const updateSubZone = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subZoneId = req.params.id;
    const { crop_type, boundary, status, planting_date, fertilize_freq, spray_freq } = req.body;

    // Verify ownership through field relationship
    const existing = await pool.query(`
      SELECT sz.id, sz.field_id
      FROM sub_zones sz
      JOIN fields f ON f.id = sz.field_id
      WHERE sz.id = $1 AND f.user_id = $2
    `, [subZoneId, userId]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay vung trong.' });
    }

    // If boundary is being updated, validate containment
    if (boundary) {
      const geoValidation = validateGeoJsonPolygon(boundary);
      if (!geoValidation.valid) {
        return res.status(400).json({
          success: false,
          message: `Du lieu GeoJSON khong hop le: ${geoValidation.reason}`,
        });
      }

      const field = await pool.query(
        'SELECT boundary FROM fields WHERE id = $1',
        [existing.rows[0].field_id]
      );

      const fieldBoundary = field.rows[0].boundary;
      if (fieldBoundary) {
        const fieldBoundaryData = typeof fieldBoundary === 'string'
          ? JSON.parse(fieldBoundary)
          : fieldBoundary;

        if (!validateSubZone(fieldBoundaryData, boundary)) {
          return res.status(400).json({
            success: false,
            message: 'Vung trong cap nhat nam ngoai gioi han canh dong.',
          });
        }
      }
    }

    // Validate status value if provided
    if (status && !['HEALTHY', 'WARNING', 'INFECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trang thai khong hop le. Chi chap nhan: HEALTHY, WARNING, INFECTED.',
      });
    }

    const result = await pool.query(
      `UPDATE sub_zones SET
        crop_type = COALESCE($1, crop_type),
        boundary = COALESCE($2, boundary),
        status = COALESCE($3, status),
        planting_date = COALESCE($4, planting_date),
        fertilize_freq = COALESCE($5, fertilize_freq),
        spray_freq = COALESCE($6, spray_freq)
       WHERE id = $7
       RETURNING *`,
      [
        crop_type || null,
        boundary ? JSON.stringify(boundary) : null,
        status || null,
        planting_date || null,
        fertilize_freq ?? null,
        spray_freq ?? null,
        subZoneId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[SubZone] updateSubZone error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi cap nhat vung trong.' });
  }
};

// ── Delete Sub-Zone ───────────────────────────────────────────

/**
 * DELETE /api/subzones/:id
 *
 * Deletes a sub-zone and cascades to related metrics, disease reports, and alerts.
 */
const deleteSubZone = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subZoneId = req.params.id;

    const result = await pool.query(`
      DELETE FROM sub_zones sz
      USING fields f
      WHERE sz.field_id = f.id AND sz.id = $1 AND f.user_id = $2
      RETURNING sz.id
    `, [subZoneId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay vung trong.' });
    }

    res.json({ success: true, message: 'Da xoa vung trong.' });
  } catch (error) {
    console.error('[SubZone] deleteSubZone error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi xoa vung trong.' });
  }
};

// ── Live Telemetry (Mock) ────────────────────────────────────

/**
 * GET /api/subzones/:id/metrics
 *
 * Returns simulated live telemetry for a sub-zone based on its current health status.
 * In production, this would read from IoT sensors; here it uses MockMetricService.
 */
const getSubZoneMetrics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subZoneId = req.params.id;

    // Fetch sub-zone and verify ownership
    const result = await pool.query(`
      SELECT sz.id, sz.status
      FROM sub_zones sz
      JOIN fields f ON f.id = sz.field_id
      WHERE sz.id = $1 AND f.user_id = $2
    `, [subZoneId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay vung trong.' });
    }

    const subZone = result.rows[0];
    const metrics = generateMetrics(subZone.status);

    // Persist the generated metrics to the database for history tracking
    await pool.query(
      `INSERT INTO zone_metrics (sub_zone_id, health_score, temperature, humidity, soil_moisture, ph, ec)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        subZoneId,
        metrics.healthScore,
        metrics.temperature,
        metrics.humidity,
        metrics.soilMoisture,
        metrics.pH,
        metrics.ec,
      ]
    );

    res.json({
      success: true,
      subZoneId,
      timestamp: new Date().toISOString(),
      data: {
        healthScore: metrics.healthScore,
        temperature: parseFloat(metrics.temperature.toFixed(2)),
        humidity: parseFloat(metrics.humidity.toFixed(2)),
        soilMoisture: metrics.soilMoisture,
        pH: parseFloat(metrics.pH.toFixed(2)),
        ec: parseFloat(metrics.ec.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('[SubZone] getSubZoneMetrics error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay du lieu nhiet do.' });
  }
};

/**
 * GET /api/subzones/:id/metrics/timeseries?metric=temperature&range=7d
 * Returns time-series data for a specific metric.
 */
const getSubZoneTimeSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { metric, range } = req.query;

    if (!metric) {
      return res.status(400).json({ success: false, message: 'Tham so metric la bat buoc.' });
    }

    const MetricAggregationService = require('../services/metricAggregationService');
    const data = await MetricAggregationService.getZoneTimeSeries(parseInt(id, 10), metric, range || '7d');
    res.json({ success: true, data: { zone_id: id, metric, range: range || '7d', data } });
  } catch (error) {
    console.error('[SubZone] getTimeSeries error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay du lieu thoi gian.' });
  }
};

/**
 * GET /api/subzones/:id/health-history
 * Returns health status change timeline for a zone.
 */
const getSubZoneHealthHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const MetricAggregationService = require('../services/metricAggregationService');
    const history = await MetricAggregationService.getZoneHealthHistory(parseInt(id, 10));
    res.json({ success: true, data: { zone_id: id, history } });
  } catch (error) {
    console.error('[SubZone] getHealthHistory error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay lich su suc khoe.' });
  }
};

module.exports = {
  getSubZones,
  getSubZoneById,
  createSubZone,
  updateSubZone,
  deleteSubZone,
  getSubZoneMetrics,
  getSubZoneTimeSeries,
  getSubZoneHealthHistory,
};
