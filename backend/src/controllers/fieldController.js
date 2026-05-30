/**
 * Field Controller — FULL VERSION
 *
 * Features:
 * - CRUD with polygon boundary (GeoJSON)
 * - Growth stage tracking
 * - Field activity timeline
 */

const pool = require('../config/db');

const GROWTH_STAGES = ['germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest', 'dormant'];

const getFields = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { zone_status } = req.query;

    // If zone_status is provided, filter fields that have at least one sub-zone with that status
    if (zone_status && ['HEALTHY', 'WARNING', 'INFECTED'].includes(zone_status)) {
      const result = await pool.query(`
        SELECT DISTINCT f.*
        FROM fields f
        JOIN sub_zones sz ON sz.field_id = f.id
        WHERE f.user_id = $1 AND sz.status = $2
        ORDER BY f.created_at DESC
      `, [userId, zone_status]);
      return res.json({ success: true, data: result.rows });
    }

    const result = await pool.query(
      'SELECT * FROM fields WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[Field] getFields error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach canh dong.' });
  }
};

const createField = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date } = req.body;

    if (!name || !crop_type || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Thieu thong tin canh dong bat buoc.' });
    }

    const result = await pool.query(
      `INSERT INTO fields (user_id, name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        userId, name, crop_type, area || null, latitude, longitude,
        boundary ? JSON.stringify(boundary) : null,
        growth_stage || 'germination',
        planting_date || null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[Field] createField error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi tao canh dong.' });
  }
};

const getFieldById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM fields WHERE id = $1 AND user_id = $2',
      [fieldId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    // Also fetch recent activities
    const activities = await pool.query(
      'SELECT * FROM field_activities WHERE field_id = $1 ORDER BY created_at DESC LIMIT 50',
      [fieldId]
    );

    res.json({
      success: true,
      data: { ...result.rows[0], activities: activities.rows },
    });
  } catch (error) {
    console.error('[Field] getFieldById error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay thong tin canh dong.' });
  }
};

const updateField = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;
    const { name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date } = req.body;

    // Verify ownership
    const existing = await pool.query('SELECT id FROM fields WHERE id = $1 AND user_id = $2', [fieldId, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    const result = await pool.query(
      `UPDATE fields SET
        name = COALESCE($1, name),
        crop_type = COALESCE($2, crop_type),
        area = COALESCE($3, area),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude),
        boundary = COALESCE($6, boundary),
        growth_stage = COALESCE($7, growth_stage),
        planting_date = COALESCE($8, planting_date)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        name || null, crop_type || null, area || null,
        latitude || null, longitude || null,
        boundary ? JSON.stringify(boundary) : null,
        growth_stage || null, planting_date || null,
        fieldId, userId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[Field] updateField error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi cap nhat canh dong.' });
  }
};

const deleteField = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;

    const result = await pool.query(
      'DELETE FROM fields WHERE id = $1 AND user_id = $2 RETURNING id',
      [fieldId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    res.json({ success: true, message: 'Da xoa canh dong.' });
  } catch (error) {
    console.error('[Field] deleteField error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi xoa canh dong.' });
  }
};

// ─── Field Activities ────────────────────────────────────────────────

const addActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;
    const { activity_type, notes, photo_url } = req.body;

    if (!activity_type) {
      return res.status(400).json({ success: false, message: 'Loai hoat dong la bat buoc.' });
    }

    // Verify field ownership
    const field = await pool.query('SELECT id FROM fields WHERE id = $1 AND user_id = $2', [fieldId, userId]);
    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    const result = await pool.query(
      'INSERT INTO field_activities (field_id, activity_type, notes, photo_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [fieldId, activity_type, notes || null, photo_url || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[Field] addActivity error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi them hoat dong.' });
  }
};

const getActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;

    // Verify field ownership
    const field = await pool.query('SELECT id FROM fields WHERE id = $1 AND user_id = $2', [fieldId, userId]);
    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    const limit = parseInt(req.query.limit, 10) || 50;
    const result = await pool.query(
      'SELECT * FROM field_activities WHERE field_id = $1 ORDER BY created_at DESC LIMIT $2',
      [fieldId, limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[Field] getActivities error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay hoat dong.' });
  }
};

/**
 * GET /api/fields/:id/zones/summary
 * Returns all zones for a field with their latest metrics and color values.
 * Single aggregated query for efficient map rendering.
 */
const getZonesSummary = async (req, res) => {
  try {
    const { id: fieldId } = req.params;
    const MetricAggregationService = require('../services/metricAggregationService');
    const zones = await MetricAggregationService.getZonesSummary(fieldId);
    res.json({ success: true, data: { fieldId, zones } });
  } catch (error) {
    console.error('[Field] getZonesSummary error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay tong quan vung.' });
  }
};

module.exports = {
  getFields,
  createField,
  getFieldById,
  updateField,
  deleteField,
  addActivity,
  getActivities,
  getZonesSummary,
};
