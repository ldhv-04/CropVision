/**
 * EpidemicService — Epidemiological Dispersion Simulator
 *
 * Computes vector path projection using a Cone of Dispersion model
 * (45° apex angle) derived from wind vectors and pathogen mobilization constants.
 *
 * When a disease is reported in a sub-zone, this service:
 *   1. Builds a triangular GeoJSON cone polygon projecting downwind from the epicenter
 *   2. Scans all candidate sub-zones for geo-spatial intersection with the danger cone
 *
 * All coordinates follow the GeoJSON [Longitude, Latitude] convention.
 */

const { polygon, multiPolygon, point } = require('@turf/helpers');
const booleanIntersects = require('@turf/boolean-intersects').default;
const destination = require('@turf/destination').default;

// ── Constants ───────────────────────────────────────────────

/** Mapping of compass direction strings to bearing angles (degrees clockwise from North). */
const DIRECTION_ANGLES = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

/** Total dispersion arc angle in degrees. */
const APEX_ANGLE = 45;

// ── Public API ──────────────────────────────────────────────

/**
 * Computes a GeoJSON triangular cone polygon projecting downwind from an infected epicenter.
 *
 * The cone is defined by:
 *   - The epicenter point (tip of the triangle)
 *   - Two boundary rays at ±(APEX_ANGLE/2) degrees from the wind direction
 *   - The rays extend to `distanceRadius` kilometers
 *
 * @param {number[]} epicenter       - Coordinates [longitude, latitude] of the infected zone centroid
 * @param {string}   windDirection   - Compass direction string ("N", "NE", "E", "SE", "S", "SW", "W", "NW")
 * @param {number}   distanceRadius  - Danger buffer distance in kilometers
 * @returns {Object} GeoJSON Feature<Polygon> representing the dispersion cone
 */
const calculateInfectedCone = (epicenter, windDirection, distanceRadius) => {
  const centerAngle = DIRECTION_ANGLES[windDirection] ?? 0;

  // Compute the left and right boundary bearings of the cone
  const leftBearing = centerAngle - APEX_ANGLE / 2;
  const rightBearing = centerAngle + APEX_ANGLE / 2;

  const ptEpicenter = point(epicenter);

  // Project two destination points at the given distance and bearing
  const destLeft = destination(ptEpicenter, distanceRadius, leftBearing, { units: 'kilometers' });
  const destRight = destination(ptEpicenter, distanceRadius, rightBearing, { units: 'kilometers' });

  // Build a closed triangular polygon: epicenter → left → right → epicenter
  return polygon([[
    epicenter,
    destLeft.geometry.coordinates,
    destRight.geometry.coordinates,
    epicenter,
  ]]);
};

/**
 * Filters an array of sub-zones to find those that intersect the danger cone.
 *
 * Each sub-zone object is expected to have a `boundary` property containing
 * a GeoJSON Polygon or MultiPolygon (either as a parsed object or a JSONB column).
 *
 * @param {Object}   conePolygon  - GeoJSON Feature<Polygon> from calculateInfectedCone
 * @param {Object[]} allSubZones  - Array of sub-zone rows from the database
 * @returns {Object[]} Array of sub-zones whose boundary intersects the cone
 */
const scanZonesInDanger = (conePolygon, allSubZones) => {
  return allSubZones.filter((zone) => {
    try {
      // boundary may already be an object (from JSONB column) or a string
      const boundaryData = typeof zone.boundary === 'string'
        ? JSON.parse(zone.boundary)
        : zone.boundary;

      // Build Turf geometry — supports both Polygon and MultiPolygon
      const zonePoly = boundaryData.type === 'MultiPolygon'
        ? multiPolygon(boundaryData.coordinates)
        : polygon(boundaryData.coordinates);

      return booleanIntersects(conePolygon, zonePoly);
    } catch {
      // Skip zones with invalid boundary data
      return false;
    }
  });
};

/**
 * Computes the centroid of a GeoJSON geometry by averaging its outer ring coordinates.
 * Supports both Polygon and MultiPolygon (uses the first polygon's outer ring).
 * This is a simple arithmetic mean — sufficient for small farm-scale polygons.
 *
 * @param {Object} boundary - GeoJSON Polygon or MultiPolygon
 * @returns {number[]} [longitude, latitude] centroid
 */
const computePolygonCentroid = (boundary) => {
  // For MultiPolygon, use the first polygon's outer ring
  const outerRing = boundary.type === 'MultiPolygon'
    ? boundary.coordinates[0][0]
    : boundary.coordinates[0];

  let sumLng = 0;
  let sumLat = 0;

  // Exclude the last point (duplicate closing point) from the average
  const count = outerRing.length - 1;
  for (let i = 0; i < count; i++) {
    sumLng += outerRing[i][0];
    sumLat += outerRing[i][1];
  }

  return [sumLng / count, sumLat / count];
};

module.exports = {
  calculateInfectedCone,
  scanZonesInDanger,
  computePolygonCentroid,
};