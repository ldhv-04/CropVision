/**
 * Spatial Calculations & Defensive Geometry Engine
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC)
 * and Rule 2.12 (Inversion-Driven testing for degenerate inputs).
 */

/**
 * Validates a GeoJSON coordinate ring for RFC 7946 compliance.
 * @param {Array<[number, number]>} ring
 * @returns {boolean}
 */
export function isValidLinearRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  for (let i = 0; i < ring.length; i++) {
    const pt = ring[i];
    if (!Array.isArray(pt) || pt.length < 2) return false;
    const [lon, lat] = pt;
    if (typeof lon !== 'number' || typeof lat !== 'number') return false;
    if (Number.isNaN(lon) || Number.isNaN(lat)) return false;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return false;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

/**
 * Computes the 2D bounding box [minLon, minLat, maxLon, maxLat].
 * @param {Array<[number, number]>} ring
 * @returns {[number, number, number, number] | null}
 */
export function calculateBoundingBox(ring) {
  if (!isValidLinearRing(ring)) return null;
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Computes polygon centroid [lon, lat] via weighted vertex average.
 * @param {Array<[number, number]>} ring
 * @returns {[number, number] | null}
 */
export function calculateCentroid(ring) {
  if (!isValidLinearRing(ring)) return null;
  let sumLon = 0;
  let sumLat = 0;
  const count = ring.length - 1; // Exclude redundant closing point

  for (let i = 0; i < count; i++) {
    sumLon += ring[i][0];
    sumLat += ring[i][1];
  }
  return [Number((sumLon / count).toFixed(6)), Number((sumLat / count).toFixed(6))];
}

/**
 * Computes approximate area in hectares using spherical geodesic formula.
 * @param {Array<[number, number]>} ring
 * @returns {number} Area in hectares (ha), minimum 0.0
 */
export function calculateAreaHectares(ring) {
  if (!isValidLinearRing(ring)) return 0;
  const R = 6378137; // WGS84 Earth radius in meters
  let area = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const p1 = ring[i];
    const p2 = ring[i + 1];
    const x1 = (p1[0] * Math.PI) / 180;
    const y1 = (p1[1] * Math.PI) / 180;
    const x2 = (p2[0] * Math.PI) / 180;
    const y2 = (p2[1] * Math.PI) / 180;
    area += (x2 - x1) * (2 + Math.sin(y1) + Math.sin(y2));
  }
  area = (Math.abs(area) * R * R) / 2.0;
  const hectares = area / 10000;
  return Number(hectares.toFixed(4));
}

/**
 * Ray-casting algorithm to test if a point is inside a polygon ring.
 * @param {[number, number]} point - [longitude, latitude]
 * @param {Array<[number, number]>} ring
 * @returns {boolean}
 */
export function isPointInPolygon(point, ring) {
  if (!point || !Array.isArray(point) || point.length < 2) return false;
  if (!isValidLinearRing(ring)) return false;

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
