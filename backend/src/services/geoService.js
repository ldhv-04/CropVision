/**
 * GeoService — Geo-Spatial Boundary Validation
 *
 * Provides methods to:
 * - Validate that a sub-zone polygon lies entirely within a field boundary
 * - Convert between GeoJSON coordinate representations
 *
 * Uses Turf.js for deterministic, standards-compliant geospatial calculations.
 * All coordinates follow the GeoJSON [Longitude, Latitude] convention.
 */

const booleanWithin = require('@turf/boolean-within').default;
const { polygon, multiPolygon } = require('@turf/helpers');

// ── Constants ───────────────────────────────────────────────

/** GeoJSON geometry types supported for field/sub-zone boundaries. */
const SUPPORTED_TYPES = ['Polygon', 'MultiPolygon'];

// ── Public API ──────────────────────────────────────────────

/**
 * Builds a Turf.js geometry feature from a GeoJSON boundary object.
 * Supports both Polygon and MultiPolygon types.
 *
 * @param {Object} boundary - GeoJSON Polygon or MultiPolygon
 * @returns {Object} Turf.js feature (polygon or multiPolygon)
 */
const buildTurfGeometry = (boundary) => {
  if (boundary.type === 'MultiPolygon') {
    return multiPolygon(boundary.coordinates);
  }
  return polygon(boundary.coordinates);
};

/**
 * Validates if a sub-zone boundary is entirely contained within the outer field boundary.
 *
 * Supports both Polygon and MultiPolygon for both the outer boundary and the sub-zone.
 * Uses the ray-casting algorithm via @turf/boolean-within to determine
 * whether every point of the inner geometry falls inside the outer geometry.
 *
 * @param {Object} outerBoundary  - GeoJSON Polygon or MultiPolygon for the field boundary
 * @param {Object} subZoneBoundary - GeoJSON Polygon or MultiPolygon for the sub-zone boundary
 * @returns {boolean} true if the sub-zone fits entirely inside the field boundary
 */
const validateSubZone = (outerBoundary, subZoneBoundary) => {
  try {
    const polyOuter = buildTurfGeometry(outerBoundary);
    const polySub = buildTurfGeometry(subZoneBoundary);
    return booleanWithin(polySub, polyOuter);
  } catch (error) {
    console.error('[GeoService] Boundary validation failed:', error.message);
    return false;
  }
};

/**
 * Validates that a GeoJSON object has the structure of a valid Polygon or MultiPolygon.
 *
 * Minimal structural check:
 *   - type must be "Polygon" or "MultiPolygon"
 *   - coordinates must be a non-empty array
 *
 * @param {Object} geoJson - The GeoJSON object to validate
 * @returns {{ valid: boolean, reason?: string }}
 */
const validateGeoJsonPolygon = (geoJson) => {
  if (!geoJson || typeof geoJson !== 'object') {
    return { valid: false, reason: 'Boundary must be a GeoJSON object.' };
  }

  if (!SUPPORTED_TYPES.includes(geoJson.type)) {
    return { valid: false, reason: `Boundary type must be "Polygon" or "MultiPolygon", got "${geoJson.type}".` };
  }

  if (!Array.isArray(geoJson.coordinates) || geoJson.coordinates.length === 0) {
    return { valid: false, reason: 'Boundary coordinates must be a non-empty array.' };
  }

  return { valid: true };
};

module.exports = {
  validateSubZone,
  validateGeoJsonPolygon,
};