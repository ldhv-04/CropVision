/**
 * fieldGeometry.js — Field geometry utilities for the Station GIS module.
 *
 * Provides polygon generation, area calculation, centroid derivation,
 * and coordinate validation for field management.
 *
 * All coordinates follow GeoJSON [Longitude, Latitude] convention.
 * Leaflet coordinates are [Latitude, Longitude].
 */

/**
 * Calculate the area of a polygon in hectares using the Shoelace formula.
 * Approximate — adequate for agricultural fields.
 *
 * @param {Array<[number, number]>} latlngs - Array of [lat, lng] pairs
 * @returns {number} Area in hectares
 */
export function calculateAreaHectares(latlngs) {
  if (!latlngs || latlngs.length < 3) return 0;

  // Shoelace formula on projected coordinates
  // Convert lat/lng to approximate meters using equirectangular projection
  const midLat = latlngs.reduce((sum, [lat]) => sum + lat, 0) / latlngs.length;
  const latFactor = 111319.9; // meters per degree latitude
  const lngFactor = 111319.9 * Math.cos((midLat * Math.PI) / 180); // meters per degree longitude

  let area = 0;
  const n = latlngs.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = latlngs[i][1] * lngFactor;
    const yi = latlngs[i][0] * latFactor;
    const xj = latlngs[j][1] * lngFactor;
    const yj = latlngs[j][0] * latFactor;
    area += xi * yj - xj * yi;
  }

  return Math.abs(area / 2) / 10000; // m² → hectares
}

/**
 * Calculate the centroid of a polygon.
 *
 * @param {Array<[number, number]>} latlngs - Array of [lat, lng] pairs
 * @returns {[number, number]} Centroid as [lat, lng]
 */
export function calculateCentroid(latlngs) {
  if (!latlngs || latlngs.length === 0) return [0, 0];

  let sumLat = 0;
  let sumLng = 0;
  for (const [lat, lng] of latlngs) {
    sumLat += lat;
    sumLng += lng;
  }

  return [sumLat / latlngs.length, sumLng / latlngs.length];
}

/**
 * Generate a regular polygon approximating a circle.
 *
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @param {number} [vertices=32] - Number of vertices
 * @returns {Array<[number, number]>} Array of [lat, lng] pairs (Leaflet format)
 */
export function generateCirclePolygon(centerLat, centerLng, radiusMeters, vertices = 32) {
  const latFactor = 111319.9;
  const lngFactor = 111319.9 * Math.cos((centerLat * Math.PI) / 180);

  const points = [];
  for (let i = 0; i < vertices; i++) {
    const angle = (2 * Math.PI * i) / vertices;
    const dLat = (radiusMeters * Math.cos(angle)) / latFactor;
    const dLng = (radiusMeters * Math.sin(angle)) / lngFactor;
    points.push([centerLat + dLat, centerLng + dLng]);
  }

  return points;
}

/**
 * Convert Leaflet [lat, lng] coordinates to GeoJSON Polygon.
 * Auto-closes the ring.
 *
 * @param {Array<[number, number]>} latlngs - [lat, lng] pairs
 * @returns {Object} GeoJSON Polygon
 */
export function toGeoJsonPolygon(latlngs) {
  const coords = latlngs.map(([lat, lng]) => [lng, lat]); // GeoJSON: [lng, lat]

  // Close the ring
  if (
    coords.length > 0 &&
    (coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push(coords[0]);
  }

  return {
    type: 'Polygon',
    coordinates: [coords],
  };
}

/**
 * Extract Leaflet-compatible [lat, lng] from GeoJSON boundary.
 *
 * @param {Object|string} boundary - GeoJSON Polygon or JSONB string
 * @returns {Array<[number, number]>} Array of [lat, lng]
 */
export function extractPolygonCoords(boundary) {
  if (!boundary) return [];

  const geo = typeof boundary === 'string' ? JSON.parse(boundary) : boundary;

  if (geo.type === 'Polygon') {
    return (geo.coordinates?.[0] || []).map(([lng, lat]) => [lat, lng]);
  }

  if (geo.type === 'MultiPolygon') {
    return (geo.coordinates?.[0]?.[0] || []).map(([lng, lat]) => [lat, lng]);
  }

  return [];
}

/**
 * Calculate bounding box for a set of [lat, lng] coordinates.
 *
 * @param {Array<[number, number]>} coords
 * @returns {[[number, number], [number, number]]|null} [[south, west], [north, east]]
 */
export function calculateBounds(coords) {
  if (!coords || coords.length === 0) return null;

  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;

  for (const [lat, lng] of coords) {
    if (lat < south) south = lat;
    if (lat > north) north = lat;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  }

  return [
    [south, west],
    [north, east],
  ];
}

/**
 * Validate latitude value.
 * @param {number} lat
 * @returns {boolean}
 */
export function isValidLatitude(lat) {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude value.
 * @param {number} lng
 * @returns {boolean}
 */
export function isValidLongitude(lng) {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Check if a polygon has self-intersections (simple check for small polygons).
 *
 * @param {Array<[number, number]>} latlngs
 * @returns {boolean} true if self-intersecting
 */
export function isSelfIntersecting(latlngs) {
  if (!latlngs || latlngs.length < 4) return false;

  const n = latlngs.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue; // Skip adjacent edges
      if (segmentsIntersect(latlngs[i], latlngs[i + 1], latlngs[j], latlngs[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if two line segments intersect.
 * @private
 */
function segmentsIntersect(p1, p2, p3, p4) {
  const d1x = p2[0] - p1[0];
  const d1y = p2[1] - p1[1];
  const d2x = p4[0] - p3[0];
  const d2y = p4[1] - p3[1];

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;

  const t = ((p3[0] - p1[0]) * d2y - (p3[1] - p1[1]) * d2x) / cross;
  const u = ((p3[0] - p1[0]) * d1y - (p3[1] - p1[1]) * d1x) / cross;

  return t > 0 && t < 1 && u > 0 && u < 1;
}

/**
 * Format area for display.
 * @param {number} hectares
 * @returns {string}
 */
export function formatArea(hectares) {
  if (hectares < 0.01) return `${(hectares * 10000).toFixed(0)} m²`;
  if (hectares < 1) return `${(hectares * 10000).toFixed(0)} m²`;
  return `${hectares.toFixed(2)} ha`;
}

/**
 * Format coordinates for display.
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
export function formatCoords(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}