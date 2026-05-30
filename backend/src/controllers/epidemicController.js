/**
 * Epidemic Controller — Disease Report & Dispersion Alert Pipeline
 *
 * Processing flow for POST /api/disease/report:
 *   1. Retrieve the reporting sub-zone's spatial data from the database
 *   2. Query active regional meteorological data from MockMetricService
 *   3. Compute the infected cone polygon via EpidemicService
 *   4. Scan all sub-zones in the database for geo-spatial collision with the cone
 *   5. Create disease_report record
 *   6. Generate zone_alert entries for each at-risk sub-zone
 *   7. Return the cone geometry and list of affected zone IDs
 */

const pool = require('../config/db');
const {
  calculateInfectedCone,
  scanZonesInDanger,
  computePolygonCentroid,
} = require('../services/epidemicService');
const { getStationWeatherMock } = require('../services/mockMetricService');

// ── Constants ───────────────────────────────────────────────

/** Default danger radius in kilometers for the dispersion cone. */
const DEFAULT_DANGER_RADIUS_KM = 5;

// ── Public API ──────────────────────────────────────────────

/**
 * POST /api/disease/report
 *
 * Ingests a disease report for a sub-zone, computes the wind-driven
 * dispersion cone, identifies at-risk zones, and generates alerts.
 *
 * Request body:
 *   { subZoneId: number, diseaseType: string, dangerRadius?: number }
 *
 * Response:
 *   { success, message, simulationCone, affectedZoneIds }
 */
const reportDisease = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subZoneId, diseaseType, dangerRadius } = req.body;

    // ── 1. Validate input ──
    if (!subZoneId || !diseaseType) {
      return res.status(400).json({
        success: false,
        message: 'Thieu subZoneId hoac diseaseType.',
      });
    }

    // ── 2. Retrieve the reporting sub-zone and verify ownership ──
    const subZoneResult = await pool.query(`
      SELECT sz.id, sz.field_id, sz.boundary, sz.status
      FROM sub_zones sz
      JOIN fields f ON f.id = sz.field_id
      WHERE sz.id = $1 AND f.user_id = $2
    `, [subZoneId, userId]);

    if (subZoneResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay vung trong.',
      });
    }

    const subZone = subZoneResult.rows[0];

    // ── 3. Compute the centroid of the infected sub-zone ──
    const boundaryData = typeof subZone.boundary === 'string'
      ? JSON.parse(subZone.boundary)
      : subZone.boundary;

    const epicenter = computePolygonCentroid(boundaryData);

    // ── 4. Query regional meteorological data ──
    // In production, this would read from an external weather API or IoT gateway.
    // For verification, we use deterministic mock values.
    const weather = getStationWeatherMock();

    // ── 5. Compute the infected dispersion cone ──
    const radius = dangerRadius || DEFAULT_DANGER_RADIUS_KM;
    const conePolygon = calculateInfectedCone(epicenter, weather.windDirection, radius);

    // ── 6. Query all sub-zones in the database for collision check ──
    // We fetch all sub-zones (excluding the reporting zone itself) to check
    // intersection with the danger cone. For large datasets, this should be
    // optimized with PostGIS spatial indexing.
    const allZonesResult = await pool.query(`
      SELECT sz.id, sz.field_id, sz.boundary, sz.crop_type, sz.status
      FROM sub_zones sz
      WHERE sz.id != $1
    `, [subZoneId]);

    const atRiskZones = scanZonesInDanger(conePolygon, allZonesResult.rows);
    const affectedZoneIds = atRiskZones.map((z) => z.id);

    // ── 7. Create disease report record ──
    const reportResult = await pool.query(
      `INSERT INTO disease_reports (sub_zone_id, disease_type) VALUES ($1, $2) RETURNING *`,
      [subZoneId, diseaseType]
    );
    const diseaseReport = reportResult.rows[0];

    // ── 8. Update the infected sub-zone status to INFECTED ──
    await pool.query(
      `UPDATE sub_zones SET status = 'INFECTED' WHERE id = $1 AND status != 'INFECTED'`,
      [subZoneId]
    );

    // ── 9. Generate zone alerts for at-risk zones ──
    let alertCount = 0;
    for (const zone of atRiskZones) {
      try {
        await pool.query(
          `INSERT INTO zone_alerts (sub_zone_id, disease_report_id, threat_level, message)
           VALUES ($1, $2, $3, $4)`,
          [
            zone.id,
            diseaseReport.id,
            'WARNING',
            `Canh bao dich benh "${diseaseType}" co the lan toi vung trong #${zone.id} (${zone.crop_type}). Gio: ${weather.windDirection}, ban kinh nguy hiem: ${radius}km.`,
          ]
        );

        // Update at-risk zone status to WARNING if currently HEALTHY
        await pool.query(
          `UPDATE sub_zones SET status = 'WARNING' WHERE id = $1 AND status = 'HEALTHY'`,
          [zone.id]
        );

        alertCount++;
      } catch (alertError) {
        console.error(`[Epidemic] Failed to create alert for zone ${zone.id}:`, alertError.message);
      }
    }

    // ── 10. Build response ──
    res.status(201).json({
      success: true,
      message: `Xu ly dich benh hoan tat. ${alertCount} canh bao da duoc gui.`,
      simulationCone: conePolygon,
      weather: {
        windDirection: weather.windDirection,
        windSpeed: weather.windSpeed,
        dangerRadiusKm: radius,
      },
      infectedZoneId: subZoneId,
      affectedZoneIds,
      diseaseReport: {
        id: diseaseReport.id,
        diseaseType: diseaseReport.disease_type,
        createdAt: diseaseReport.created_at,
      },
    });
  } catch (error) {
    console.error('[Epidemic] reportDisease error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi xu ly dich benh.' });
  }
};

/**
 * GET /api/epidemic/alerts
 *
 * Returns all alerts for sub-zones belonging to the authenticated user,
 * joined with disease report details.
 */
const getUserAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT za.*, dr.disease_type, dr.created_at AS reported_at,
             sz.crop_type, sz.field_id
      FROM zone_alerts za
      JOIN disease_reports dr ON dr.id = za.disease_report_id
      JOIN sub_zones sz ON sz.id = za.sub_zone_id
      JOIN fields f ON f.id = sz.field_id
      WHERE f.user_id = $1
      ORDER BY za.created_at DESC
      LIMIT 100
    `, [userId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[Epidemic] getUserAlerts error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach canh bao.' });
  }
};

/**
 * PATCH /api/epidemic/alerts/:id/read
 *
 * Marks an alert as read.
 */
const markAlertRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertId = req.params.id;

    const result = await pool.query(`
      UPDATE zone_alerts za SET is_read = TRUE
      FROM sub_zones sz, fields f
      WHERE za.sub_zone_id = sz.id
        AND sz.field_id = f.id
        AND za.id = $1
        AND f.user_id = $2
      RETURNING za.id
    `, [alertId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh bao.' });
    }

    res.json({ success: true, message: 'Da danh dau da doc.' });
  } catch (error) {
    console.error('[Epidemic] markAlertRead error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi cap nhat canh bao.' });
  }
};

/**
 * PATCH /api/epidemic/reports/:id/resolve
 *
 * Marks a disease report as resolved and resets the infected zone status.
 */
const resolveDiseaseReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const reportId = req.params.id;

    // Verify ownership through the sub-zone → field relationship (unless admin)
    let query = `
      SELECT dr.id, dr.sub_zone_id
      FROM disease_reports dr
      JOIN sub_zones sz ON sz.id = dr.sub_zone_id
      JOIN fields f ON f.id = sz.field_id
      WHERE dr.id = $1
    `;
    let params = [reportId];
    if (role !== 'admin') {
      query += ` AND f.user_id = $2`;
      params.push(userId);
    }

    const report = await pool.query(query, params);

    if (report.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay bao cao dich benh.' });
    }

    // Mark report as resolved
    await pool.query(
      'UPDATE disease_reports SET is_resolved = TRUE WHERE id = $1',
      [reportId]
    );

    // Reset the zone status back to HEALTHY
    await pool.query(
      `UPDATE sub_zones SET status = 'HEALTHY' WHERE id = $1`,
      [report.rows[0].sub_zone_id]
    );

    // Deactivate related alerts
    await pool.query(
      'UPDATE zone_alerts SET is_read = TRUE WHERE disease_report_id = $1',
      [reportId]
    );

    res.json({ success: true, message: 'Bao cao dich benh da duoc giai quyet.' });
  } catch (error) {
    console.error('[Epidemic] resolveDiseaseReport error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi giai quyet bao cao.' });
  }
};

// ── Station: Custom Wind Simulation (Preview Only) ──────────

/**
 * POST /api/epidemic/simulate
 *
 * Re-runs the dispersion cone simulation with custom wind parameters
 * WITHOUT creating new alerts. Used by the station admin dashboard
 * to preview how different wind conditions would affect zone coverage.
 *
 * Request body:
 *   { diseaseReportId: number, windDirection: string, windSpeed?: number, dangerRadius?: number }
 *
 * Response:
 *   { success, simulationCone, weather, affectedZoneIds }
 */
const simulateDispersion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { diseaseReportId, windDirection, windSpeed, dangerRadius } = req.body;

    // ── 1. Validate input ──
    if (!diseaseReportId || !windDirection) {
      return res.status(400).json({
        success: false,
        message: 'Thieu diseaseReportId hoac windDirection.',
      });
    }

    // Validate wind direction
    const validDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    if (!validDirections.includes(windDirection)) {
      return res.status(400).json({
        success: false,
        message: `windDirection khong hop le. Chap nhan: ${validDirections.join(', ')}`,
      });
    }

    // ── 2. Retrieve the disease report and its sub-zone ──
    let query = `
      SELECT dr.id, dr.disease_type, dr.sub_zone_id, sz.boundary
      FROM disease_reports dr
      JOIN sub_zones sz ON sz.id = dr.sub_zone_id
      JOIN fields f ON f.id = sz.field_id
      WHERE dr.id = $1
    `;
    let params = [diseaseReportId];
    if (role !== 'admin') {
      query += ` AND f.user_id = $2`;
      params.push(userId);
    }

    const reportResult = await pool.query(query, params);

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay bao cao dich benh.',
      });
    }

    const report = reportResult.rows[0];

    // ── 3. Compute the centroid of the infected sub-zone ──
    const boundaryData = typeof report.boundary === 'string'
      ? JSON.parse(report.boundary)
      : report.boundary;

    const epicenter = computePolygonCentroid(boundaryData);

    // ── 4. Build custom weather parameters ──
    const radius = dangerRadius || DEFAULT_DANGER_RADIUS_KM;
    const speed = windSpeed || 5.4;

    // ── 5. Compute the dispersion cone with custom wind ──
    const conePolygon = calculateInfectedCone(epicenter, windDirection, radius);

    // ── 6. Scan all sub-zones for collision ──
    const allZonesResult = await pool.query(`
      SELECT sz.id, sz.field_id, sz.boundary, sz.crop_type, sz.status
      FROM sub_zones sz
      WHERE sz.id != $1
    `, [report.sub_zone_id]);

    const atRiskZones = scanZonesInDanger(conePolygon, allZonesResult.rows);
    const affectedZoneIds = atRiskZones.map((z) => z.id);

    // ── 7. Return preview (NO database writes — this is a simulation) ──
    res.json({
      success: true,
      message: `Mo phong hoan tat. ${atRiskZones.length} vung trong co the bi anh huong.`,
      simulationCone: conePolygon,
      weather: {
        windDirection,
        windSpeed: speed,
        dangerRadiusKm: radius,
      },
      infectedZoneId: report.sub_zone_id,
      affectedZoneIds,
      affectedZones: atRiskZones.map((z) => ({
        id: z.id,
        cropType: z.crop_type,
        status: z.status,
      })),
    });
  } catch (error) {
    console.error('[Epidemic] simulateDispersion error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi mo phong lan truyen.' });
  }
};

// ── Station: Active Outbreak Ledger ─────────────────────────

/**
 * GET /api/epidemic/outbreaks
 *
 * Returns all unresolved disease reports (active outbreaks) with their
 * infected zone info for the station admin incident ledger.
 *
 * Each entry includes the zone boundary, disease type, and the number
 * of affected downwind zones.
 */
const getOutbreaks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let query = `
      SELECT dr.id AS report_id,
             dr.disease_type,
             dr.created_at AS reported_at,
             sz.id AS infected_zone_id,
             sz.crop_type,
             sz.boundary,
             sz.field_id,
             f.name AS field_name,
             (SELECT COUNT(*) FROM zone_alerts za WHERE za.disease_report_id = dr.id) AS alert_count,
             (SELECT COUNT(*) FROM zone_alerts za WHERE za.disease_report_id = dr.id AND za.is_read = FALSE) AS unread_alert_count
      FROM disease_reports dr
      JOIN sub_zones sz ON sz.id = dr.sub_zone_id
      JOIN fields f ON f.id = sz.field_id
      WHERE dr.is_resolved = FALSE
    `;
    let queryParams = [];
    if (role !== 'admin') {
      query += ` AND f.user_id = $1`;
      queryParams.push(userId);
    }
    query += ` ORDER BY dr.created_at DESC`;

    const result = await pool.query(query, queryParams);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[Epidemic] getOutbreaks error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach dich benh.' });
  }
};

/**
 * GET /api/epidemic/outbreaks/:id
 *
 * Returns a single outbreak with full detail including all affected zone
 * boundaries and the most recent cone simulation.
 */
const getOutbreakDetail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const reportId = req.params.id;

    // Get the disease report
    let query = `
      SELECT dr.*, sz.boundary AS infected_boundary, sz.crop_type, sz.field_id, f.name AS field_name
      FROM disease_reports dr
      JOIN sub_zones sz ON sz.id = dr.sub_zone_id
      JOIN fields f ON f.id = sz.field_id
      WHERE dr.id = $1
    `;
    let params = [reportId];
    if (role !== 'admin') {
      query += ` AND f.user_id = $2`;
      params.push(userId);
    }

    const reportResult = await pool.query(query, params);

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay bao cao dich benh.',
      });
    }

    const report = reportResult.rows[0];

    // Get all alerts for this outbreak with zone details
    const alertsResult = await pool.query(`
      SELECT za.id AS alert_id,
             za.threat_level,
             za.message,
             za.is_read,
             za.created_at AS alert_at,
             sz.id AS zone_id,
             sz.crop_type,
             sz.status,
             sz.boundary
      FROM zone_alerts za
      JOIN sub_zones sz ON sz.id = za.sub_zone_id
      WHERE za.disease_report_id = $1
      ORDER BY za.created_at DESC
    `, [reportId]);

    res.json({
      success: true,
      data: {
        ...report,
        affectedZones: alertsResult.rows,
      },
    });
  } catch (error) {
    console.error('[Epidemic] getOutbreakDetail error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay chi tiet dich benh.' });
  }
};

module.exports = {
  reportDisease,
  getUserAlerts,
  markAlertRead,
  resolveDiseaseReport,
  simulateDispersion,
  getOutbreaks,
  getOutbreakDetail,
};
