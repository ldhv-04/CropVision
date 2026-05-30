/**
 * Walk Controller — GPS Boundary Walk Sessions
 *
 * Enables farmers to walk around their field perimeter while the mobile app
 * streams GPS coordinates every 2 seconds. The collected points are then
 * converted into a GeoJSON Polygon boundary for the field.
 *
 * Flow:
 *   1. POST   /api/fields/:fieldId/walk/start      — Create walk session
 *   2. PATCH  /api/fields/:fieldId/walk/:walkId/points — Append GPS points
 *   3. POST   /api/fields/:fieldId/walk/:walkId/complete — Close path → GeoJSON boundary
 */

const pool = require('../config/db');
const { validateGeoJsonPolygon } = require('../services/geoService');

// ── Constants ───────────────────────────────────────────────

/** Minimum number of GPS points required to form a valid polygon boundary */
const MIN_POINTS = 4;

/** Minimum perimeter distance (degrees) to prevent degenerate polygons */
const MIN_PERIMETER_SPAN = 0.0001;

// ── Helpers ─────────────────────────────────────────────────

/**
 * Closes a ring of [lng, lat] GPS points into a valid GeoJSON Polygon
 * or merges with an existing MultiPolygon field boundary.
 *
 * If the field already has a MultiPolygon boundary, the walked path
 * is converted to an additional polygon patch appended to the MultiPolygon.
 *
 * @param {number[][]} points - Array of [lng, lat] GPS coordinates
 * @param {Object|null} existingBoundary - Current field boundary (Polygon/MultiPolygon) or null
 * @returns {Object} GeoJSON Polygon or MultiPolygon
 */
const buildPolygonFromPath = (points, existingBoundary = null) => {
  // Remove consecutive near-duplicate points (within ~1 metre)
  const deduplicated = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = deduplicated[deduplicated.length - 1];
    const curr = points[i];
    const dlng = Math.abs(curr[0] - prev[0]);
    const dlat = Math.abs(curr[1] - prev[1]);
    if (dlng > 0.00001 || dlat > 0.00001) {
      deduplicated.push(curr);
    }
  }

  // Close the ring by appending the first point
  if (deduplicated.length >= MIN_POINTS) {
    deduplicated.push(deduplicated[0]);
  }

  const newPolygonCoords = [deduplicated];

  // If existing boundary is a MultiPolygon, merge the new walk into it
  if (existingBoundary && existingBoundary.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: [...existingBoundary.coordinates, newPolygonCoords],
    };
  }

  // If existing boundary is a Polygon, convert to MultiPolygon with both patches
  if (existingBoundary && existingBoundary.type === 'Polygon') {
    return {
      type: 'MultiPolygon',
      coordinates: [existingBoundary.coordinates, newPolygonCoords],
    };
  }

  // No existing boundary — return simple Polygon
  return {
    type: 'Polygon',
    coordinates: newPolygonCoords,
  };
};

/**
 * Computes the bounding box span of a set of GPS points.
 * Used to validate that the walked path covers a meaningful area.
 *
 * @param {number[][]} points - Array of [lng, lat] coordinates
 * @returns {{ lngSpan: number, latSpan: number }}
 */
const computeSpan = (points) => {
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return {
    lngSpan: maxLng - minLng,
    latSpan: maxLat - minLat,
  };
};

// ── Public API ──────────────────────────────────────────────

/**
 * POST /api/fields/:fieldId/walk/start
 *
 * Creates a new GPS walk session for the specified field.
 * The mobile app will begin streaming GPS points to the points endpoint.
 */
const startWalk = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.fieldId;

    // Verify field ownership
    const field = await pool.query(
      'SELECT id FROM fields WHERE id = $1 AND user_id = $2',
      [fieldId, userId]
    );

    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh dong.' });
    }

    // Close any existing incomplete walks for this field
    await pool.query(
      `UPDATE gps_walks SET is_completed = TRUE, completed_at = NOW()
       WHERE field_id = $1 AND is_completed = FALSE`,
      [fieldId]
    );

    // Create new walk session
    const result = await pool.query(
      `INSERT INTO gps_walks (field_id, points) VALUES ($1, '[]'::jsonb) RETURNING *`,
      [fieldId]
    );

    res.status(201).json({
      success: true,
      data: {
        walkId: result.rows[0].id,
        fieldId,
        message: 'Bat dau di bo xung quanh canh dong. Gui diem GPS moi 2 giay.',
      },
    });
  } catch (error) {
    console.error('[Walk] startWalk error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi khoi tao phien di bo.' });
  }
};

/**
 * PATCH /api/fields/:fieldId/walk/:walkId/points
 *
 * Appends GPS points to an active walk session.
 * The mobile app calls this endpoint every 2 seconds with new coordinates.
 *
 * Request body:
 *   { points: [[lng1, lat1], [lng2, lat2], ...] }
 *
 * Supports both single point and bulk append for flexibility.
 */
const appendPoints = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.fieldId;
    const walkId = req.params.walkId;
    const { points } = req.body;

    // Validate input
    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'points phai la mang khong trong cua [lng, lat] cap.',
      });
    }

    // Validate each point format
    for (const pt of points) {
      if (!Array.isArray(pt) || pt.length < 2 ||
          typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Moi diem phai la [longitude, latitude] cap so.',
        });
      }
    }

    // Verify walk exists and belongs to the user's field
    const walk = await pool.query(`
      SELECT gw.id, gw.is_completed
      FROM gps_walks gw
      JOIN fields f ON f.id = gw.field_id
      WHERE gw.id = $1 AND gw.field_id = $2 AND f.user_id = $3
    `, [walkId, fieldId, userId]);

    if (walk.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay phien di bo.' });
    }

    if (walk.rows[0].is_completed) {
      return res.status(400).json({
        success: false,
        message: 'Phien di bo da hoan tat. Khong the them diem.',
      });
    }

    // Append new points to the existing JSONB array
    // Using jsonb_append equivalent via array concatenation
    await pool.query(
      `UPDATE gps_walks
       SET points = points::jsonb || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(points), walkId]
    );

    // Get total point count
    const countResult = await pool.query(
      `SELECT jsonb_array_length(points) as count FROM gps_walks WHERE id = $1`,
      [walkId]
    );

    res.json({
      success: true,
      data: {
        walkId,
        pointsAdded: points.length,
        totalPoints: countResult.rows[0].count,
      },
    });
  } catch (error) {
    console.error('[Walk] appendPoints error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi them diem GPS.' });
  }
};

/**
 * POST /api/fields/:fieldId/walk/:walkId/complete
 *
 * Completes the GPS walk session and converts the collected path
 * into a GeoJSON Polygon boundary saved to the field.
 *
 * Validation:
 *   - Minimum 4 GPS points required
 *   - Path must cover a meaningful area (not a degenerate line)
 *   - Generated polygon is validated as a proper GeoJSON structure
 */
const completeWalk = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.fieldId;
    const walkId = req.params.walkId;

    // Verify walk exists and belongs to the user
    const walk = await pool.query(`
      SELECT gw.id, gw.points, gw.is_completed
      FROM gps_walks gw
      JOIN fields f ON f.id = gw.field_id
      WHERE gw.id = $1 AND gw.field_id = $2 AND f.user_id = $3
    `, [walkId, fieldId, userId]);

    if (walk.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay phien di bo.' });
    }

    if (walk.rows[0].is_completed) {
      return res.status(400).json({
        success: false,
        message: 'Phien di bo da hoan tat truoc do.',
      });
    }

    const rawPoints = walk.rows[0].points;

    // Validate minimum point count
    if (!Array.isArray(rawPoints) || rawPoints.length < MIN_POINTS) {
      return res.status(400).json({
        success: false,
        message: `Can it nhat ${MIN_POINTS} diem GPS de tao bien gioi. Hien co: ${rawPoints ? rawPoints.length : 0}.`,
      });
    }

    // Validate that the path covers a meaningful area
    const span = computeSpan(rawPoints);
    if (span.lngSpan < MIN_PERIMETER_SPAN && span.latSpan < MIN_PERIMETER_SPAN) {
      return res.status(400).json({
        success: false,
        message: 'Duong di qua nho. Vui long di bo xung quanh canh dong.',
      });
    }

    // Fetch existing field boundary (may be Polygon, MultiPolygon, or null)
    const fieldResult = await pool.query(
      'SELECT boundary FROM fields WHERE id = $1',
      [fieldId]
    );
    const existingBoundary = fieldResult.rows[0]?.boundary
      ? (typeof fieldResult.rows[0].boundary === 'string'
        ? JSON.parse(fieldResult.rows[0].boundary)
        : fieldResult.rows[0].boundary)
      : null;

    // Build GeoJSON polygon from the walked path (merges with existing MultiPolygon)
    const boundary = buildPolygonFromPath(rawPoints, existingBoundary);

    // Validate the generated polygon or multi-polygon
    const validation = validateGeoJsonPolygon(boundary);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Khong the tao bien gioi hop le: ${validation.reason}`,
      });
    }

    // Save boundary to the field
    await pool.query(
      'UPDATE fields SET boundary = $1 WHERE id = $2',
      [JSON.stringify(boundary), fieldId]
    );

    // Mark walk as completed
    await pool.query(
      'UPDATE gps_walks SET is_completed = TRUE, completed_at = NOW() WHERE id = $1',
      [walkId]
    );

    res.json({
      success: true,
      message: 'Bien gioi canh dong da duoc cap nhat tu duong di GPS.',
      data: {
        walkId,
        fieldId,
        pointCount: rawPoints.length,
        boundary,
      },
    });
  } catch (error) {
    console.error('[Walk] completeWalk error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi hoan tat phien di bo.' });
  }
};

/**
 * GET /api/fields/:fieldId/walk/:walkId
 *
 * Returns the current state of a walk session including all collected points.
 * Useful for the mobile app to render the live polyline path.
 */
const getWalkStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.fieldId;
    const walkId = req.params.walkId;

    const result = await pool.query(`
      SELECT gw.*
      FROM gps_walks gw
      JOIN fields f ON f.id = gw.field_id
      WHERE gw.id = $1 AND gw.field_id = $2 AND f.user_id = $3
    `, [walkId, fieldId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay phien di bo.' });
    }

    const walk = result.rows[0];
    const pointCount = Array.isArray(walk.points) ? walk.points.length : 0;

    res.json({
      success: true,
      data: {
        walkId: walk.id,
        fieldId: walk.field_id,
        isCompleted: walk.is_completed,
        pointCount,
        points: walk.points,
        createdAt: walk.created_at,
        completedAt: walk.completed_at,
      },
    });
  } catch (error) {
    console.error('[Walk] getWalkStatus error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay trang thai phien di bo.' });
  }
};

module.exports = {
  startWalk,
  appendPoints,
  completeWalk,
  getWalkStatus,
};