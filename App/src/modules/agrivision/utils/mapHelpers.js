/**
 * mapHelpers — Map utility functions for the Field Management module.
 *
 * GeoJSON parsing, bounds calculation, polygon simplification helpers.
 */

/**
 * Extract polygon coordinates from a GeoJSON boundary object.
 * Supports Polygon and MultiPolygon types.
 *
 * @param {object} boundary - GeoJSON geometry or { type, coordinates }
 * @returns {Array<[lat, lng]>} Leaflet-compatible coordinate pairs
 */
export function extractPolygonCoords(boundary) {
  if (!boundary) return [];

  // Handle JSONB string
  const geo = typeof boundary === 'string' ? JSON.parse(boundary) : boundary;

  if (geo.type === 'Polygon') {
    // GeoJSON: [lng, lat] → Leaflet: [lat, lng]
    return (geo.coordinates?.[0] || []).map(([lng, lat]) => [lat, lng]);
  }

  if (geo.type === 'MultiPolygon') {
    // Return first polygon's outer ring for simple rendering
    return (geo.coordinates?.[0]?.[0] || []).map(([lng, lat]) => [lat, lng]);
  }

  return [];
}

/**
 * Extract all polygon rings from a MultiPolygon or Polygon.
 * Returns array of arrays of [lat, lng] pairs.
 */
export function extractAllPolygons(boundary) {
  if (!boundary) return [];
  const geo = typeof boundary === 'string' ? JSON.parse(boundary) : boundary;

  if (geo.type === 'Polygon') {
    return geo.coordinates.map((ring) =>
      ring.map(([lng, lat]) => [lat, lng])
    );
  }

  if (geo.type === 'MultiPolygon') {
    return geo.coordinates.map((polygon) =>
      polygon[0].map(([lng, lat]) => [lat, lng])
    );
  }

  return [];
}

/**
 * Convert Leaflet [lat, lng] back to GeoJSON [lng, lat].
 */
export function toGeoJsonCoords(latlngs) {
  return latlngs.map(([lat, lng]) => [lng, lat]);
}

/**
 * Wrap coordinates in a GeoJSON Polygon structure.
 */
export function toGeoJsonPolygon(latlngs) {
  const coords = toGeoJsonCoords(latlngs);
  // Close the ring if not already closed
  if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
    coords.push(coords[0]);
  }
  return {
    type: 'Polygon',
    coordinates: [coords],
  };
}

/**
 * Calculate bounding box for a set of [lat, lng] coordinates.
 * Returns [[south, west], [north, east]] for Leaflet fitBounds.
 */
export function calculateBounds(coords) {
  if (!coords || coords.length === 0) return null;

  let south = Infinity, west = Infinity;
  let north = -Infinity, east = -Infinity;

  for (const [lat, lng] of coords) {
    if (lat < south) south = lat;
    if (lat > north) north = lat;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  }

  return [[south, west], [north, east]];
}

/**
 * Calculate bounds for a field including all its zone boundaries.
 * @param {Array} zones - array of zone objects with boundary property
 * @returns {[[number,number],[number,number]]|null}
 */
export function calculateFieldBounds(zones) {
  if (!zones || zones.length === 0) return null;

  let south = Infinity, west = Infinity;
  let north = -Infinity, east = -Infinity;

  for (const zone of zones) {
    const coords = extractPolygonCoords(zone.boundary);
    for (const [lat, lng] of coords) {
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      if (lng < west) west = lng;
      if (lng > east) east = lng;
    }
  }

  if (south === Infinity) return null;
  return [[south, west], [north, east]];
}

/**
 * Calculate the centroid of a polygon from [lat, lng] coordinates.
 * Simple arithmetic mean (adequate for small polygons).
 */
export function calculateCentroid(coords) {
  if (!coords || coords.length === 0) return [0, 0];

  let sumLat = 0, sumLng = 0;
  for (const [lat, lng] of coords) {
    sumLat += lat;
    sumLng += lng;
  }

  return [sumLat / coords.length, sumLng / coords.length];
}

/**
 * Douglas-Peucker line simplification algorithm.
 * Reduces polygon vertex count for performance at low zoom levels.
 *
 * @param {Array<[number,number]>} points
 * @param {number} epsilon - tolerance in degrees (0.0001 ≈ ~11m)
 * @returns {Array<[number,number]>}
 */
export function simplifyPoints(points, epsilon = 0.0001) {
  if (points.length <= 2) return points;

  // Find the point with the maximum distance from the line between first and last
  let maxDist = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPoints(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

/**
 * Perpendicular distance from a point to a line defined by two points.
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const [px, py] = point;
  const [ax, ay] = lineStart;
  const [bx, by] = lineEnd;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/**
 * Format area for display (hectares or sqm).
 */
export function formatArea(areaHa) {
  if (areaHa == null) return '—';
  if (areaHa < 0.01) return `${Math.round(areaHa * 10000)} m²`;
  return `${Number(areaHa).toFixed(2)} ha`;
}