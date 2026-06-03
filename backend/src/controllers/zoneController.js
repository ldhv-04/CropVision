/**
 * Zone Controller — Management Zone Editor (Station/Admin)
 *
 * Spatial management of internal zones within a field boundary.
 * Focus: zone geometry, codes, validation, draft/publish workflow.
 *
 * Does NOT handle: crop type, planting date, fertilizer, irrigation,
 * crop diary, or user cultivation details.
 *
 * TASK 1 — Station-to-Mobile Bridge:
 * - Publishing creates a versioned snapshot in field_zone_maps.
 * - Mobile APIs read ONLY from field_zone_maps (status = 'published').
 * - Previous published versions are archived when a new one is published.
 * - Publishing requires field.owner_user_id to be set.
 *
 * FUTURE DEPENDENCY NOTE:
 * - Crop/cultivation data (Task 3) should be stored in separate tables.
 * - If published zone geometry changes after cultivation data exists,
 *   migration rules will be required for zone_id mapping.
 */

const pool = require('../config/db');
const { validateGeoJsonPolygon, validateSubZone, validateGeometry, calculatePolygonArea, calculateBoundaryCentroid } = require('../services/geoService');

// ── List Zones for a Field ────────────────────────────────────

/**
 * GET /api/fields/:fieldId/zones
 *
 * Returns all management zones belonging to the specified field.
 * Used by the Zone Editor to display zone list and map.
 */
const getZones = async (req, res) => {
  try {
    const fieldId = req.params.fieldId;

    // Get the field (select only columns guaranteed to exist)
    // Task 1: Also select owner_user_id and owner_email_snapshot for station zone editor display.
    const field = await pool.query(
      'SELECT id, name, boundary, area, user_id, owner_user_id, owner_email_snapshot FROM fields WHERE id = $1',
      [fieldId]
    );

    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    // Use SELECT * to be resilient to migration state.
    // New columns (code, name, area, zone_status, etc.) will appear after migration runs.
    // Before migration, only base columns exist: id, field_id, crop_type, boundary, status, planting_date, fertilize_freq, spray_freq, created_at.
    const zones = await pool.query(`
      SELECT *
      FROM sub_zones sz
      WHERE sz.field_id = $1
      ORDER BY sz.created_at ASC
    `, [fieldId]);

    // Normalize zone data — ensure consistent shape regardless of migration state
    const normalizedZones = zones.rows.map((z, idx) => ({
      id: z.id,
      field_id: z.field_id,
      code: z.code || null,
      name: z.name || null,
      boundary: z.boundary,
      area: z.area || null,
      status: z.status || 'HEALTHY',
      zone_status: z.zone_status || 'draft',
      published_at: z.published_at || null,
      created_at: z.created_at,
      updated_at: z.updated_at || z.created_at,
    }));

    // Normalize field data
    const normalizedField = {
      id: field.rows[0].id,
      name: field.rows[0].name,
      code: field.rows[0].code || null,
      boundary: field.rows[0].boundary,
      area: field.rows[0].area,
      user_id: field.rows[0].user_id,
      zones_published_at: field.rows[0].zones_published_at || null,
      // Task 1: Owner info for station zone editor display
      owner_user_id: field.rows[0].owner_user_id || null,
      owner_email: field.rows[0].owner_email_snapshot || null,
    };

    res.json({
      success: true,
      data: {
        field: normalizedField,
        zones: normalizedZones,
      },
    });
  } catch (error) {
    console.error('[Zone] getZones error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      fieldId: req.params.fieldId,
    });
    res.status(500).json({ success: false, message: 'Failed to load zones.', error: error.message });
  }
};

// ── Create Zone ───────────────────────────────────────────────

/**
 * POST /api/fields/:fieldId/zones
 *
 * Creates a new management zone within a field.
 * Auto-generates zone code if not provided.
 * Validates geometry containment within parent field.
 */
const createZone = async (req, res) => {
  try {
    const fieldId = req.params.fieldId;
    const { code, name, boundary } = req.body;
    const stationId = req.user.userId;

    // Validate required fields
    if (!boundary) {
      return res.status(400).json({
        success: false,
        message: 'Zone boundary is required.',
      });
    }

    // Validate GeoJSON structure
    const geoValidation = validateGeoJsonPolygon(boundary);
    if (!geoValidation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid GeoJSON: ${geoValidation.reason}`,
      });
    }

    // Get parent field
    const field = await pool.query(
      'SELECT id, name, code, boundary, user_id FROM fields WHERE id = $1',
      [fieldId]
    );

    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    const parentField = field.rows[0];

    // Geospatial containment check
    const fieldBoundary = parentField.boundary;
    if (fieldBoundary) {
      const fieldBoundaryData = typeof fieldBoundary === 'string'
        ? JSON.parse(fieldBoundary)
        : fieldBoundary;

      const isContained = validateSubZone(fieldBoundaryData, boundary);
      if (!isContained) {
        return res.status(400).json({
          success: false,
          message: 'Zone is outside the field boundary. Please redraw.',
        });
      }
    }

    // Auto-generate zone code if not provided
    let zoneCode = code;
    if (!zoneCode) {
      zoneCode = await generateZoneCode(fieldId, parentField.code || 'F');
    }

    // Check zone code uniqueness
    const existingCode = await pool.query(
      'SELECT id FROM sub_zones WHERE field_id = $1 AND code = $2',
      [fieldId, zoneCode]
    );

    if (existingCode.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Zone code ${zoneCode} already exists.`,
      });
    }

    // Calculate area
    const areaHa = calculatePolygonArea(boundary);

    // Try inserting with all new columns. If migration hasn't run, fall back to base columns.
    let result;
    try {
      result = await pool.query(
        `INSERT INTO sub_zones (field_id, code, name, boundary, area, crop_type, zone_status, created_by_station_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7) RETURNING *`,
        [
          fieldId,
          zoneCode,
          name || `Zone ${zoneCode}`,
          JSON.stringify(boundary),
          areaHa,
          'pending', // Placeholder - user will set later
          stationId,
        ]
      );
    } catch (insertErr) {
      // If new columns don't exist (migration not run), fall back to base columns
      if (insertErr.code === '42703') { // undefined_column
        console.warn('[Zone] Falling back to base INSERT (migration not applied yet)');
        result = await pool.query(
          `INSERT INTO sub_zones (field_id, boundary, crop_type)
           VALUES ($1, $2, $3) RETURNING *`,
          [fieldId, JSON.stringify(boundary), 'pending']
        );
      } else {
        throw insertErr;
      }
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[Zone] createZone error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create zone.' });
  }
};

// ── Update Zone ───────────────────────────────────────────────

/**
 * PATCH /api/fields/:fieldId/zones/:zoneId
 *
 * Updates zone geometry, name, or code.
 */
const updateZone = async (req, res) => {
  try {
    const { fieldId, zoneId } = req.params;
    const { code, name, boundary } = req.body;

    // Verify zone belongs to field
    const existing = await pool.query(
      'SELECT id, field_id, code FROM sub_zones WHERE id = $1 AND field_id = $2',
      [zoneId, fieldId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Zone not found.' });
    }

    // If boundary is being updated, validate containment
    if (boundary) {
      const geoValidation = validateGeoJsonPolygon(boundary);
      if (!geoValidation.valid) {
        return res.status(400).json({
          success: false,
          message: `Invalid GeoJSON: ${geoValidation.reason}`,
        });
      }

      const field = await pool.query('SELECT boundary FROM fields WHERE id = $1', [fieldId]);
      const fieldBoundary = field.rows[0].boundary;
      if (fieldBoundary) {
        const fieldBoundaryData = typeof fieldBoundary === 'string'
          ? JSON.parse(fieldBoundary)
          : fieldBoundary;

        if (!validateSubZone(fieldBoundaryData, boundary)) {
          return res.status(400).json({
            success: false,
            message: 'Updated zone is outside the field boundary.',
          });
        }
      }
    }

    // Check code uniqueness if changing
    if (code && code !== existing.rows[0].code) {
      const dup = await pool.query(
        'SELECT id FROM sub_zones WHERE field_id = $1 AND code = $2 AND id != $3',
        [fieldId, code, zoneId]
      );
      if (dup.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Zone code ${code} already exists.`,
        });
      }
    }

    // Calculate new area if boundary changed
    const areaHa = boundary ? calculatePolygonArea(boundary) : null;

    const result = await pool.query(
      `UPDATE sub_zones SET
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        boundary = COALESCE($3, boundary),
        area = COALESCE($4, area),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        code || null,
        name || null,
        boundary ? JSON.stringify(boundary) : null,
        areaHa,
        zoneId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[Zone] updateZone error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update zone.' });
  }
};

// ── Delete Zone ───────────────────────────────────────────────

/**
 * DELETE /api/fields/:fieldId/zones/:zoneId
 */
const deleteZone = async (req, res) => {
  try {
    const { fieldId, zoneId } = req.params;

    const result = await pool.query(
      'DELETE FROM sub_zones WHERE id = $1 AND field_id = $2 RETURNING id',
      [zoneId, fieldId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Zone not found.' });
    }

    res.json({ success: true, message: 'Zone deleted.' });
  } catch (error) {
    console.error('[Zone] deleteZone error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete zone.' });
  }
};

// ── Validate Zones ────────────────────────────────────────────

/**
 * POST /api/fields/:fieldId/zones/validate
 *
 * Validates all zones for a field:
 * - Valid geometry
 * - Inside parent boundary
 * - No overlaps
 * - Unique codes
 * - Minimum area threshold
 */
const validateZones = async (req, res) => {
  try {
    const fieldId = req.params.fieldId;
    const errors = [];
    const warnings = [];

    // Get parent field
    // DEPENDENCY NOTE (Task 1): We now check owner_user_id (the mobile user who owns the field)
    // instead of user_id (the station admin who created the field).
    const field = await pool.query(
      'SELECT id, boundary, area, user_id, owner_user_id FROM fields WHERE id = $1',
      [fieldId]
    );

    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    const parentField = field.rows[0];

    // Check if field has assigned owner (required for publishing)
    // owner_user_id is the registered mobile user; user_id is the station creator.
    if (!parentField.owner_user_id) {
      errors.push({
        type: 'NO_OWNER',
        message: 'Field must be assigned to an owner before publishing. Use POST /api/fields/:id/assign-owner.',
        severity: 'error',
      });
    }

    // Get all zones
    const zones = await pool.query(
      'SELECT id, code, name, boundary, area FROM sub_zones WHERE field_id = $1',
      [fieldId]
    );

    if (zones.rows.length === 0) {
      warnings.push({
        type: 'NO_ZONES',
        message: 'No management zones configured.',
        severity: 'warning',
      });
      return res.json({ success: true, data: { valid: false, errors, warnings, stats: { total: 0, valid: 0, invalid: 0 } } });
    }

    const zoneList = zones.rows;
    const fieldBoundary = parentField.boundary;
    const fieldBoundaryData = fieldBoundary
      ? (typeof fieldBoundary === 'string' ? JSON.parse(fieldBoundary) : fieldBoundary)
      : null;

    // Track codes for uniqueness check
    const codeMap = new Map();
    let validCount = 0;
    let invalidCount = 0;

    for (const zone of zoneList) {
      let zoneValid = true;
      const boundary = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;

      // 1. Validate geometry structure
      const geoCheck = validateGeoJsonPolygon(boundary);
      if (!geoCheck.valid) {
        errors.push({
          type: 'INVALID_GEOMETRY',
          zoneId: zone.id,
          zoneCode: zone.code,
          message: `${zone.code || 'Zone'} has invalid geometry: ${geoCheck.reason}`,
          severity: 'error',
        });
        zoneValid = false;
      }

      // 2. Validate geometry validity (non-self-intersecting)
      if (geoCheck.valid) {
        const validityCheck = validateGeometry(boundary);
        if (!validityCheck.valid) {
          errors.push({
            type: 'INVALID_GEOMETRY',
            zoneId: zone.id,
            zoneCode: zone.code,
            message: `${zone.code || 'Zone'} has invalid geometry: ${validityCheck.reason}`,
            severity: 'error',
          });
          zoneValid = false;
        }
      }

      // 3. Check containment within parent field
      if (fieldBoundaryData && geoCheck.valid) {
        const isContained = validateSubZone(fieldBoundaryData, boundary);
        if (!isContained) {
          errors.push({
            type: 'OUTSIDE_BOUNDARY',
            zoneId: zone.id,
            zoneCode: zone.code,
            message: `${zone.code || 'Zone'} is partially or fully outside the field boundary.`,
            severity: 'error',
          });
          zoneValid = false;
        }
      }

      // 4. Check minimum area (0.001 ha = 10 m²)
      const area = zone.area || calculatePolygonArea(boundary);
      if (area < 0.001) {
        warnings.push({
          type: 'SMALL_ZONE',
          zoneId: zone.id,
          zoneCode: zone.code,
          message: `${zone.code || 'Zone'} area is very small (${(area * 10000).toFixed(0)} m²).`,
          severity: 'warning',
        });
      }

      // 5. Code uniqueness
      if (zone.code) {
        if (codeMap.has(zone.code)) {
          errors.push({
            type: 'DUPLICATE_CODE',
            zoneId: zone.id,
            zoneCode: zone.code,
            message: `Zone code ${zone.code} is duplicated.`,
            severity: 'error',
          });
          zoneValid = false;
        }
        codeMap.set(zone.code, zone.id);
      } else {
        warnings.push({
          type: 'NO_CODE',
          zoneId: zone.id,
          message: `A zone has no code assigned.`,
          severity: 'warning',
        });
      }

      if (zoneValid) validCount++;
      else invalidCount++;
    }

    // 6. Check for zone overlaps
    for (let i = 0; i < zoneList.length; i++) {
      for (let j = i + 1; j < zoneList.length; j++) {
        const a = zoneList[i];
        const b = zoneList[j];
        const bndA = typeof a.boundary === 'string' ? JSON.parse(a.boundary) : a.boundary;
        const bndB = typeof b.boundary === 'string' ? JSON.parse(b.boundary) : b.boundary;

        if (checkOverlap(bndA, bndB)) {
          errors.push({
            type: 'OVERLAP',
            zoneId: a.id,
            zoneCode: a.code,
            message: `${a.code || 'Zone'} overlaps with ${b.code || 'Zone'}.`,
            severity: 'error',
          });
          // Don't mark as invalid here to avoid double-counting
        }
      }
    }

    const hasFieldOwner = !!parentField.owner_user_id;
    const isValid = errors.length === 0 && hasFieldOwner;

    res.json({
      success: true,
      data: {
        valid: isValid,
        errors,
        warnings,
        stats: {
          total: zoneList.length,
          valid: validCount,
          invalid: invalidCount,
          hasOwner: hasFieldOwner,
        },
      },
    });
  } catch (error) {
    console.error('[Zone] validateZones error:', error.message);
    res.status(500).json({ success: false, message: 'Validation failed.' });
  }
};

// ── Publish Zones ─────────────────────────────────────────────

/**
 * POST /api/fields/:fieldId/zones/publish
 *
 * Validates and publishes zones.
 * Only publishes if validation passes.
 */
const publishZones = async (req, res) => {
  try {
    const fieldId = req.params.fieldId;

    // Run validation first
    const field = await pool.query(
      'SELECT id, boundary, area, user_id FROM fields WHERE id = $1',
      [fieldId]
    );

    if (field.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    const parentField = field.rows[0];

    // ── Owner check (Task 1: Station-to-Mobile bridge) ──
    // DEPENDENCY NOTE: Publishing requires owner_user_id to be set.
    // Mobile APIs will only expose published maps to the field owner.
    // The field must have owner_user_id (not just user_id which is the creator).
    const fieldWithOwner = await pool.query(
      'SELECT owner_user_id FROM fields WHERE id = $1',
      [fieldId]
    );
    const ownerId = fieldWithOwner.rows[0]?.owner_user_id;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Field must be assigned to an owner before publishing. Use POST /api/fields/:id/assign-owner first.',
        errors: [{ type: 'NO_OWNER', message: 'Field has no assigned owner (owner_user_id).' }],
      });
    }

    // Must have zones
    const zones = await pool.query(
      'SELECT id, code, name, boundary, area FROM sub_zones WHERE field_id = $1',
      [fieldId]
    );

    if (zones.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No zones to publish. Create at least one zone first.',
      });
    }

    // Validate geometry and containment
    const fieldBoundary = parentField.boundary;
    const fieldBoundaryData = fieldBoundary
      ? (typeof fieldBoundary === 'string' ? JSON.parse(fieldBoundary) : fieldBoundary)
      : null;

    const errors = [];
    const codeMap = new Map();

    for (const zone of zones.rows) {
      const boundary = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;

      // Geometry check
      const geoCheck = validateGeoJsonPolygon(boundary);
      if (!geoCheck.valid) {
        errors.push(`${zone.code || 'Zone'} has invalid geometry.`);
        continue;
      }

      // Containment check
      if (fieldBoundaryData) {
        if (!validateSubZone(fieldBoundaryData, boundary)) {
          errors.push(`${zone.code || 'Zone'} is outside the field boundary.`);
        }
      }

      // Code uniqueness
      if (zone.code) {
        if (codeMap.has(zone.code)) {
          errors.push(`Duplicate zone code: ${zone.code}.`);
        }
        codeMap.set(zone.code, zone.id);
      } else {
        errors.push(`A zone is missing a code.`);
      }
    }

    // Overlap check
    for (let i = 0; i < zones.rows.length; i++) {
      for (let j = i + 1; j < zones.rows.length; j++) {
        const a = zones.rows[i];
        const b = zones.rows[j];
        const bndA = typeof a.boundary === 'string' ? JSON.parse(a.boundary) : a.boundary;
        const bndB = typeof b.boundary === 'string' ? JSON.parse(b.boundary) : b.boundary;

        if (checkOverlap(bndA, bndB)) {
          errors.push(`${a.code || 'Zone'} overlaps with ${b.code || 'Zone'}.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Fix errors before publishing.',
        errors,
      });
    }

    // ── All validation passed — publish with versioning ──
    const now = new Date().toISOString();
    const publishedBy = req.user.userId;

    // 1. Archive any previously published versions
    await pool.query(
      `UPDATE field_zone_maps SET status = 'archived', updated_at = $1
       WHERE field_id = $2 AND status = 'published'`,
      [now, fieldId]
    );

    // 2. Get next version number
    const maxVersionResult = await pool.query(
      'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM field_zone_maps WHERE field_id = $1',
      [fieldId]
    );
    const nextVersion = maxVersionResult.rows[0].next_version;

    // 3. Build zones_data snapshot (lightweight polygon-only for mobile)
    const zonesSnapshot = zones.rows.map(zone => {
      const boundary = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
      return {
        id: zone.id,
        code: zone.code || null,
        name: zone.name || null,
        area: zone.area ? parseFloat(zone.area) : calculatePolygonArea(boundary),
        boundary: boundary,
      };
    });

    // 4. Create new published zone map version
    await pool.query(
      `INSERT INTO field_zone_maps (field_id, version, status, published_at, published_by, zones_data, boundary_data, zones_count)
       VALUES ($1, $2, 'published', $3, $4, $5, $6, $7)`,
      [
        fieldId,
        nextVersion,
        now,
        publishedBy,
        JSON.stringify(zonesSnapshot),
        fieldBoundaryData ? JSON.stringify(fieldBoundaryData) : null,
        zones.rows.length,
      ]
    );

    // 5. Update sub_zones to published status
    await pool.query(
      `UPDATE sub_zones SET zone_status = 'published', published_at = $1, updated_at = $1
       WHERE field_id = $2`,
      [now, fieldId]
    );

    // 6. Update field metadata
    await pool.query(
      'UPDATE fields SET zones_published_at = $1, zone_map_version = $2 WHERE id = $3',
      [now, nextVersion, fieldId]
    );

    console.log(`[Zone] Published zone map v${nextVersion} for field ${fieldId}: ${zones.rows.length} zones`);

    res.json({
      success: true,
      message: 'Zones published successfully.',
      data: {
        fieldId,
        version: nextVersion,
        status: 'published',
        publishedAt: now,
        zonesCount: zones.rows.length,
      },
    });
  } catch (error) {
    console.error('[Zone] publishZones error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to publish zones.' });
  }
};

// ── Helper: Generate Zone Code ────────────────────────────────

async function generateZoneCode(fieldId, fieldCode) {
  // Get existing codes for this field
  const existing = await pool.query(
    'SELECT code FROM sub_zones WHERE field_id = $1 AND code IS NOT NULL ORDER BY code',
    [fieldId]
  );

  const existingCodes = new Set(existing.rows.map((r) => r.code));

  // Try fieldCode + number (A1, A2, A3...)
  const base = fieldCode || 'Z';
  let counter = 1;
  let candidate = `${base}${counter}`;

  while (existingCodes.has(candidate)) {
    counter++;
    candidate = `${base}${counter}`;
  }

  return candidate;
}

// ── Helper: Check Overlap ─────────────────────────────────────

/**
 * Simple bounding-box overlap check for two GeoJSON polygons.
 * For full polygon intersection, use @turf/intersect.
 * This is a fast pre-filter; false positives are acceptable.
 */
function checkOverlap(boundaryA, boundaryB) {
  try {
    const coordsA = boundaryA.type === 'Polygon' ? boundaryA.coordinates[0] : boundaryA.coordinates[0][0];
    const coordsB = boundaryB.type === 'Polygon' ? boundaryB.coordinates[0] : boundaryB.coordinates[0][0];

    if (!coordsA || !coordsB) return false;

    // Calculate bounding boxes
    const bboxA = getBBox(coordsA);
    const bboxB = getBBox(coordsB);

    // If bounding boxes don't overlap, polygons don't overlap
    if (bboxA.maxLng < bboxB.minLng || bboxA.minLng > bboxB.maxLng ||
        bboxA.maxLat < bboxB.minLat || bboxA.minLat > bboxB.maxLat) {
      return false;
    }

    // Bounding boxes overlap — potential overlap
    // Use @turf/boolean-intersects for precise check
    try {
      const booleanIntersects = require('@turf/boolean-intersects').default;
      const { polygon } = require('@turf/helpers');
      const featA = polygon(coordsA.length ? [coordsA] : coordsA);
      const featB = polygon(coordsB.length ? [coordsB] : coordsB);
      return booleanIntersects(featA, featB);
    } catch (turfErr) {
      // If turf not available, use bounding-box overlap as approximation
      console.warn('[Zone] Turf intersects unavailable, using bbox overlap:', turfErr.message);
      return true; // Conservative: assume overlap if bbox overlaps
    }
  } catch (error) {
    console.warn('[Zone] Overlap check failed:', error.message);
    return false;
  }
}

function getBBox(coords) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

module.exports = {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  validateZones,
  publishZones,
};
