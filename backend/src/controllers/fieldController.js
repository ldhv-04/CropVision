/**
 * Field Controller — FULL VERSION
 *
 * Features:
 * - CRUD with polygon boundary (GeoJSON)
 * - Growth stage tracking
 * - Field activity timeline
 * - Owner assignment by email (Task 1: Station-to-Mobile bridge)
 *
 * DEPENDENCY NOTE (station → mobile):
 * - Field owner assignment uses user.email for lookup but stores user.id as owner_user_id.
 * - Publishing a zone map (in zoneController) requires field.owner_user_id to be set.
 * - Mobile APIs expose only published maps owned by the authenticated user.
 */

const pool = require('../config/db');
const geoService = require('../services/geoService');

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
        WHERE f.user_id = $1 AND sz.status = $2 AND (f.is_active IS NULL OR f.is_active = TRUE)
        ORDER BY f.created_at DESC
      `, [userId, zone_status]);
      return res.json({ success: true, data: result.rows });
    }

    const result = await pool.query(
      'SELECT * FROM fields WHERE user_id = $1 AND (is_active IS NULL OR is_active = TRUE) ORDER BY created_at DESC',
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
    const { name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date, color, notes, status } = req.body;

    if (!name || !crop_type) {
      return res.status(400).json({ success: false, message: 'Thieu thong tin canh dong bat buoc (name, crop_type).' });
    }

    // If boundary is provided, validate and auto-derive lat/lng/area
    let finalLat = latitude || null;
    let finalLng = longitude || null;
    let finalArea = area || null;
    let boundaryJson = null;

    if (boundary) {
      const validation = geoService.validateGeometry(boundary);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: `Loi boundary: ${validation.reason}` });
      }
      boundaryJson = JSON.stringify(boundary);

      // Auto-derive centroid
      const centroid = geoService.calculateBoundaryCentroid(boundary);
      finalLng = centroid[0];
      finalLat = centroid[1];

      // Auto-calculate area if not provided
      if (!finalArea) {
        finalArea = geoService.calculatePolygonArea(boundary);
      }
    }

    const result = await pool.query(
      `INSERT INTO fields (user_id, name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date, color, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        userId, name, crop_type, finalArea, finalLat, finalLng,
        boundaryJson,
        growth_stage || 'germination',
        planting_date || null,
        color || '#4CAF50',
        notes || null,
        status || 'ACTIVE',
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
    const { name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date, color, notes, status } = req.body;

    // Verify ownership
    const existing = await pool.query('SELECT id FROM fields WHERE id = $1 AND user_id = $2', [fieldId, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    // If boundary is being updated, validate and auto-derive
    let boundaryJson = null;
    let finalLat = latitude || null;
    let finalLng = longitude || null;
    let finalArea = area || null;

    if (boundary) {
      const validation = geoService.validateGeometry(boundary);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: `Loi boundary: ${validation.reason}` });
      }
      boundaryJson = JSON.stringify(boundary);

      const centroid = geoService.calculateBoundaryCentroid(boundary);
      finalLng = centroid[0];
      finalLat = centroid[1];

      if (!finalArea) {
        finalArea = geoService.calculatePolygonArea(boundary);
      }
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
        planting_date = COALESCE($8, planting_date),
        color = COALESCE($11, color),
        notes = COALESCE($12, notes),
        status = COALESCE($13, status)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        name || null, crop_type || null, finalArea,
        finalLat, finalLng,
        boundaryJson,
        growth_stage || null, planting_date || null,
        fieldId, userId,
        color || null, notes || null, status || null,
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

    // Soft delete: set deleted_at and is_active = FALSE
    const result = await pool.query(
      `UPDATE fields SET deleted_at = NOW(), is_active = FALSE
       WHERE id = $1 AND user_id = $2 AND (is_active IS NULL OR is_active = TRUE)
       RETURNING id`,
      [fieldId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    res.json({ success: true, message: 'Da chuyen canh dong vao thung rac.' });
  } catch (error) {
    console.error('[Field] deleteField error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi xoa canh dong.' });
  }
};

/**
 * GET /api/fields/trash
 * Returns soft-deleted fields for the current user.
 */
const getTrash = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT * FROM fields WHERE user_id = $1 AND is_active = FALSE AND deleted_at IS NOT NULL ORDER BY deleted_at DESC',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[Field] getTrash error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay thung rac.' });
  }
};

/**
 * PATCH /api/fields/:id/restore
 * Restores a soft-deleted field.
 */
const restoreField = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;

    const result = await pool.query(
      `UPDATE fields SET deleted_at = NULL, is_active = TRUE
       WHERE id = $1 AND user_id = $2 AND is_active = FALSE
       RETURNING *`,
      [fieldId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong trong thung rac.' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Da khoi phuc canh dong.' });
  } catch (error) {
    console.error('[Field] restoreField error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi khoi phuc canh dong.' });
  }
};

/**
 * DELETE /api/fields/:id/permanent
 * Permanently deletes a field (hard delete, from trash only).
 */
const permanentDeleteField = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;

    const result = await pool.query(
      'DELETE FROM fields WHERE id = $1 AND user_id = $2 AND is_active = FALSE RETURNING id',
      [fieldId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong trong thung rac.' });
    }

    res.json({ success: true, message: 'Da xoa vinh vien canh dong.' });
  } catch (error) {
    console.error('[Field] permanentDeleteField error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi xoa vinh vien canh dong.' });
  }
};

/**
 * POST /api/fields/generate-polygon
 * Generates a polygon from center point + radius (convenience tool).
 * Returns GeoJSON Polygon without saving to database.
 */
const generatePolygon = async (req, res) => {
  try {
    const { latitude, longitude, radius_meters, vertices } = req.body;

    if (latitude === undefined || longitude === undefined || !radius_meters) {
      return res.status(400).json({ success: false, message: 'Thieu latitude, longitude, hoac radius_meters.' });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ success: false, message: 'Latitude phai tu -90 den 90.' });
    }
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, message: 'Longitude phai tu -180 den 180.' });
    }
    if (radius_meters <= 0 || radius_meters > 50000) {
      return res.status(400).json({ success: false, message: 'Radius phai tu 1 den 50000 met.' });
    }

    const boundary = geoService.generateCirclePolygon(latitude, longitude, radius_meters, vertices || 32);
    const area_hectares = geoService.calculatePolygonArea(boundary);

    res.json({ success: true, data: { boundary, area_hectares } });
  } catch (error) {
    console.error('[Field] generatePolygon error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi tao polygon.' });
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

// ─── Field Owner Assignment (Task 1: Station-to-Mobile bridge) ────

/**
 * POST /api/fields/:id/assign-owner
 *
 * Assigns a field to a mobile user by looking up their registered Gmail/email.
 * Station/Admin only.
 *
 * Flow:
 * 1. Validate email is provided
 * 2. Look up user by email in users table
 * 3. If not found, return 404 with clear message
 * 4. If found, set field.owner_user_id = user.id
 * 5. Set field.owner_email_snapshot = email (for display/debug only)
 * 6. Return updated field
 *
 * DEPENDENCY NOTE:
 * - Email is used ONLY for lookup, NOT as the primary relationship key.
 * - The actual relationship is owner_user_id (UUID FK -> users.id).
 * - owner_email_snapshot is stored for display/debug only, not for joins/lookups.
 * - Publishing a zone map requires owner_user_id to be set.
 */
const assignOwner = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;
    const { email } = req.body;

    // 1. Validate email
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    // 2. Verify field exists (admin can assign any field)
    const fieldResult = await pool.query(
      'SELECT id, name, code, owner_user_id FROM fields WHERE id = $1',
      [fieldId]
    );

    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    // 3. Look up user by email
    const userResult = await pool.query(
      'SELECT id, full_name, email FROM users WHERE LOWER(email) = $1',
      [trimmedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with this email. The user must register first.',
      });
    }

    const targetUser = userResult.rows[0];

    // 4. Update field with owner
    const updateResult = await pool.query(
      `UPDATE fields SET
        owner_user_id = $1,
        owner_email_snapshot = $2
       WHERE id = $3
       RETURNING id, name, code, owner_user_id, owner_email_snapshot`,
      [targetUser.id, trimmedEmail, fieldId]
    );

    const updatedField = updateResult.rows[0];

    console.log(`[Field] Owner assigned: field ${fieldId} → user ${targetUser.id} (${trimmedEmail})`);

    res.json({
      success: true,
      field: {
        id: updatedField.id,
        name: updatedField.name,
        code: updatedField.code || null,
        ownerUserId: updatedField.owner_user_id,
        ownerEmail: updatedField.owner_email_snapshot,
      },
    });
  } catch (error) {
    console.error('[Field] assignOwner error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to assign field owner.' });
  }
};

module.exports = {
  getFields,
  createField,
  getFieldById,
  updateField,
  deleteField,
  getTrash,
  restoreField,
  permanentDeleteField,
  generatePolygon,
  addActivity,
  getActivities,
  getZonesSummary,
  assignOwner,
};
