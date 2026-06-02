/**
 * Mobile Controller — Field Owner APIs
 *
 * TASK 1: Station-to-Mobile data pipeline.
 *
 * Provides read-only APIs for authenticated mobile users to:
 * 1. List fields assigned to them (by owner_user_id)
 * 2. Fetch the latest published polygon-only zone map for a field they own
 *
 * ACCESS RULES:
 * - Only authenticated users (any role) can call these endpoints.
 * - Users can only see fields where fields.owner_user_id = their user id.
 * - Users can only see 'published' zone maps (never draft).
 * - Response is lightweight polygon-only GeoJSON — no satellite tiles, no MapLibre.
 *
 * DEPENDENCY NOTE (station → mobile):
 * - Publishing a zone map via station requires field.owner_user_id to be set.
 * - This controller reads ONLY from field_zone_maps (status = 'published').
 * - Draft sub_zones from the station zone editor are NEVER exposed here.
 *
 * FUTURE DEPENDENCY NOTE (cultivation data):
 * - Crop/cultivation details (crop_type, planting_date, fertilizer, etc.)
 *   should be stored in separate tables (Task 3), NOT in sub_zones or field_zone_maps.
 * - If published zone geometry changes after users have cultivation data,
 *   migration rules will be required for zone_id mapping.
 */

const pool = require('../config/db');

// ── GET /api/mobile/fields ──────────────────────────────────────
/**
 * Returns a lightweight list of fields assigned to the authenticated mobile user.
 *
 * Response shape:
 * {
 *   "fields": [
 *     {
 *       "id": 123,
 *       "name": "Rẫy A",
 *       "code": "A",
 *       "area": 1.43,
 *       "zonesCount": 4,
 *       "latestMapVersion": 3,
 *       "publishedAt": "2026-06-01T10:00:00Z"
 *     }
 *   ]
 * }
 */
const getMyFields = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT
        f.id,
        f.name,
        f.code,
        f.area,
        f.boundary,
        f.owner_user_id,
        f.owner_email_snapshot,
        f.zone_map_version,
        f.zones_published_at,
        f.created_at,
        (
          SELECT zp.zones_count
          FROM field_zone_maps zp
          WHERE zp.field_id = f.id AND zp.status = 'published'
          ORDER BY zp.version DESC
          LIMIT 1
        ) AS zones_count,
        (
          SELECT zp.published_at
          FROM field_zone_maps zp
          WHERE zp.field_id = f.id AND zp.status = 'published'
          ORDER BY zp.version DESC
          LIMIT 1
        ) AS latest_published_at
      FROM fields f
      WHERE f.owner_user_id = $1
        AND (f.is_active IS NULL OR f.is_active = TRUE)
        AND f.zones_published_at IS NOT NULL
      ORDER BY f.created_at DESC
    `, [userId]);

    const fields = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code || null,
      area: row.area ? parseFloat(row.area) : null,
      zonesCount: row.zones_count ? parseInt(row.zones_count, 10) : 0,
      latestMapVersion: row.zone_map_version || 0,
      publishedAt: row.latest_published_at || row.zones_published_at,
    }));

    res.json({ fields });
  } catch (error) {
    console.error('[Mobile] getMyFields error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch fields.' });
  }
};

// ── GET /api/mobile/fields/:fieldId/zone-map ────────────────────
/**
 * Returns the latest published polygon-only zone map for a field.
 *
 * The authenticated user must be the field owner (owner_user_id).
 * Only 'published' maps are returned — never draft.
 *
 * Response shape:
 * {
 *   "field": {
 *     "id": 123,
 *     "name": "Rẫy A",
 *     "code": "A",
 *     "area": 1.43
 *   },
 *   "map": {
 *     "type": "polygon-only",
 *     "version": 3,
 *     "publishedAt": "2026-06-01T10:00:00Z",
 *     "boundary": { "type": "Polygon", "coordinates": [...] },
 *     "zones": [
 *       {
 *         "id": "zone_1",
 *         "code": "A1",
 *         "name": "Zone A1",
 *         "area": 0.35,
 *         "geometry": { "type": "Polygon", "coordinates": [...] }
 *       }
 *     ]
 *   }
 * }
 *
 * IMPORTANT: No satellite tiles, no MapLibre, no tile URLs.
 * This is pure polygon GeoJSON for lightweight mobile rendering.
 */
const getFieldZoneMap = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.fieldId;

    if (!fieldId) {
      return res.status(400).json({ success: false, message: 'Invalid field ID.' });
    }

    // 1. Verify field exists and user is the owner
    let fieldResult;
    try {
      fieldResult = await pool.query(
        'SELECT id, name, code, area, boundary, owner_user_id FROM fields WHERE id = $1',
        [fieldId]
      );
    } catch (queryErr) {
      // Handle invalid UUID format gracefully
      console.warn('[Mobile] getFieldZoneMap query error:', queryErr.message);
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    const field = fieldResult.rows[0];

    // Authorization: only the field owner can access the zone map
    if (field.owner_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this field.',
      });
    }

    // 2. Get the latest published zone map
    const mapResult = await pool.query(`
      SELECT id, version, published_at, zones_data, boundary_data, zones_count
      FROM field_zone_maps
      WHERE field_id = $1 AND status = 'published'
      ORDER BY version DESC
      LIMIT 1
    `, [fieldId]);

    if (mapResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No published zone map available for this field.',
      });
    }

    const zoneMap = mapResult.rows[0];

    // 3. Parse JSONB data (PostgreSQL driver may return it as object or string)
    let zonesData = zoneMap.zones_data;
    if (typeof zonesData === 'string') {
      zonesData = JSON.parse(zonesData);
    }

    let boundaryData = zoneMap.boundary_data;
    if (typeof boundaryData === 'string') {
      boundaryData = JSON.parse(boundaryData);
    }

    // 4. Parse field boundary if boundary_data not stored in zone map
    if (!boundaryData && field.boundary) {
      boundaryData = typeof field.boundary === 'string'
        ? JSON.parse(field.boundary)
        : field.boundary;
    }

    // 5. Shape the response — polygon-only, lightweight
    const response = {
      field: {
        id: field.id,
        name: field.name,
        code: field.code || null,
        area: field.area ? parseFloat(field.area) : null,
      },
      map: {
        type: 'polygon-only',
        version: zoneMap.version,
        publishedAt: zoneMap.published_at,
        boundary: boundaryData || null,
        zones: (zonesData || []).map(zone => ({
          id: zone.id || null,
          code: zone.code || null,
          name: zone.name || null,
          area: zone.area ? parseFloat(zone.area) : null,
          geometry: zone.boundary || zone.geometry || null,
        })),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[Mobile] getFieldZoneMap error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch zone map.' });
  }
};

module.exports = {
  getMyFields,
  getFieldZoneMap,
};