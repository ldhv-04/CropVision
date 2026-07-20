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

// ── Polygon Generation ────────────────────────────────────────

/**
 * Generates a regular polygon approximating a circle.
 * Uses @turf/circle for geodesic accuracy.
 *
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @param {number} [vertices=32] - Number of vertices
 * @returns {Object} GeoJSON Polygon
 */
const generateCirclePolygon = (centerLat, centerLng, radiusMeters, vertices = 32) => {
  const turfCircle = require('@turf/circle').default;
  const center = [centerLng, centerLat]; // GeoJSON [lng, lat]
  const radiusKm = radiusMeters / 1000;
  const circle = turfCircle(center, radiusKm, { steps: vertices, units: 'kilometers' });
  return circle.geometry;
};

// ── Area Calculation ──────────────────────────────────────────

/**
 * Calculates the area of a GeoJSON Polygon in hectares.
 *
 * @param {Object} boundary - GeoJSON Polygon or MultiPolygon
 * @returns {number} Area in hectares
 */
const calculatePolygonArea = (boundary) => {
  try {
    const turfArea = require('@turf/area').default;
    const { feature } = require('@turf/helpers');
    const feat = feature(boundary);
    const areaM2 = turfArea(feat);
    return Math.round((areaM2 / 10000) * 10000) / 10000; // hectares, 4 decimal places
  } catch (error) {
    console.error('[GeoService] Area calculation failed:', error.message);
    return 0;
  }
};

// ── Centroid Calculation ──────────────────────────────────────

/**
 * Calculates the centroid of a GeoJSON Polygon.
 * Returns [longitude, latitude] (GeoJSON convention).
 *
 * @param {Object} boundary - GeoJSON Polygon
 * @returns {[number, number]} [longitude, latitude]
 */
const calculateBoundaryCentroid = (boundary) => {
  try {
    const turfCentroid = require('@turf/centroid').default;
    const { feature } = require('@turf/helpers');
    const feat = feature(boundary);
    const center = turfCentroid(feat);
    return center.geometry.coordinates; // [lng, lat]
  } catch (error) {
    console.error('[GeoService] Centroid calculation failed:', error.message);
    // Fallback: simple arithmetic mean of exterior ring
    const coords = boundary.type === 'Polygon' ? boundary.coordinates[0] : boundary.coordinates[0][0];
    if (!coords || coords.length === 0) return [0, 0];
    let sumLng = 0, sumLat = 0;
    for (const [lng, lat] of coords) {
      sumLng += lng;
      sumLat += lat;
    }
    return [sumLng / coords.length, sumLat / coords.length];
  }
};

// ── Geometry Validation ───────────────────────────────────────

/**
 * Validates that a GeoJSON geometry is structurally valid and non-self-intersecting.
 *
 * @param {Object} boundary - GeoJSON Polygon or MultiPolygon
 * @returns {{ valid: boolean, reason?: string }}
 */
const validateGeometry = (boundary) => {
  const structural = validateGeoJsonPolygon(boundary);
  if (!structural.valid) return structural;

  try {
    const booleanValid = require('@turf/boolean-valid').default;
    const { feature } = require('@turf/helpers');
    const feat = feature(boundary);
    if (!booleanValid(feat)) {
      return { valid: false, reason: 'Polygon geometry is not valid (may be self-intersecting).' };
    }
  } catch (error) {
    // If @turf/boolean-valid is not available, skip advanced validation
    console.warn('[GeoService] Advanced validation skipped:', error.message);
  }

  return { valid: true };
};

module.exports = {
  validateSubZone,
  validateGeoJsonPolygon,
  generateCirclePolygon,
  calculatePolygonArea,
  calculateBoundaryCentroid,
  validateGeometry,
};
