/**
 * GeoJSON to SVG Utility — Mobile Field Map
 *
 * Converts GeoJSON Polygon/MultiPolygon coordinates into SVG path data.
 * This is a field diagram renderer, NOT a navigational map projection.
 *
 * DEPENDENCY NOTE:
 * - Coordinates are normalized into local SVG space using bounding-box fit.
 * - Y-axis is inverted because screen coordinates increase downward.
 * - No satellite tiles, no MapLibre, no tile URLs.
 *
 * @module geoToSvg
 */

/**
 * Extract all coordinate rings from a GeoJSON geometry.
 * Handles Polygon, MultiPolygon, Feature, and FeatureCollection.
 */
function extractRings(geometry) {
  if (!geometry) return [];

  // Unwrap Feature/FeatureCollection
  if (geometry.type === 'Feature') {
    return extractRings(geometry.geometry);
  }
  if (geometry.type === 'FeatureCollection') {
    return geometry.features.flatMap((f) => extractRings(f));
  }

  const rings = [];

  if (geometry.type === 'Polygon') {
    // Each polygon has outer ring + optional holes
    for (const ring of geometry.coordinates) {
      if (ring && ring.length >= 3) {
        rings.push(ring);
      }
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        if (ring && ring.length >= 3) {
          rings.push(ring);
        }
      }
    }
  }

  return rings;
}

/**
 * Compute bounding box from all coordinate rings.
 * Returns { minLng, maxLng, minLat, maxLat }.
 */
function computeBBox(rings) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const ring of rings) {
    for (const coord of ring) {
      const [lng, lat] = coord;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return { minLng, maxLng, minLat, maxLat };
}

/**
 * Convert a coordinate ring to an SVG path string.
 * Normalizes lng/lat to screen x/y within the drawable area.
 */
function ringToSvgPath(ring, bbox, width, height, padding) {
  const { minLng, maxLng, minLat, maxLat } = bbox;

  const lngRange = maxLng - minLng || 0.0001;
  const latRange = maxLat - minLat || 0.0001;

  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;

  const points = ring.map(([lng, lat]) => {
    // Normalize to 0-1 range
    const nx = (lng - minLng) / lngRange;
    const ny = (maxLat - lat) / latRange; // Invert Y: high lat = top

    // Map to SVG viewport
    const x = nx * drawableWidth + padding;
    const y = ny * drawableHeight + padding;

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return `M${points.join('L')}Z`;
}

/**
 * Compute the centroid of a coordinate ring (simple average).
 */
function computeCentroid(ring) {
  if (!ring || ring.length === 0) return [0, 0];
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / ring.length, sumLat / ring.length];
}

/**
 * Convert centroid coordinates to SVG viewport position.
 */
function centroidToSvg(centroid, bbox, width, height, padding) {
  const { minLng, maxLng, minLat, maxLat } = bbox;
  const lngRange = maxLng - minLng || 0.0001;
  const latRange = maxLat - minLat || 0.0001;

  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;

  const nx = (centroid[0] - minLng) / lngRange;
  const ny = (maxLat - centroid[1]) / latRange;

  return {
    x: nx * drawableWidth + padding,
    y: ny * drawableHeight + padding,
  };
}

/**
 * Main function: Convert a GeoJSON geometry to drawable SVG objects.
 *
 * @param {Object} geometry - GeoJSON Polygon or MultiPolygon
 * @param {number} svgWidth - SVG viewport width
 * @param {number} svgHeight - SVG viewport height
 * @param {number} [padding=16] - Padding around the geometry
 * @returns {{ paths: string[], centroid: {x: number, y: number}, bbox: Object, valid: boolean }}
 */
export function geometryToSvg(geometry, svgWidth, svgHeight, padding = 16) {
  const rings = extractRings(geometry);

  if (rings.length === 0) {
    return { paths: [], centroid: { x: 0, y: 0 }, bbox: null, valid: false };
  }

  const bbox = computeBBox(rings);
  const paths = rings.map((ring) => ringToSvgPath(ring, bbox, svgWidth, svgHeight, padding));

  // Use first ring's centroid as the primary label point
  const centroid = computeCentroid(rings[0]);
  const svgCentroid = centroidToSvg(centroid, bbox, svgWidth, svgHeight, padding);

  return { paths, centroid: svgCentroid, bbox, valid: true };
}

/**
 * Convert all zones to SVG drawable objects.
 *
 * @param {Array} zones - Array of zone objects with geometry property
 * @param {Object} boundary - Field boundary GeoJSON
 * @param {number} svgWidth - SVG viewport width
 * @param {number} svgHeight - SVG viewport height
 * @param {number} [padding=16] - Padding
 * @returns {{ boundarySvg, zoneSvgs: Array, valid: boolean }}
 */
export function buildFieldMapSvg(zones, boundary, svgWidth, svgHeight, padding = 16) {
  // Use boundary for overall bounding box if available, otherwise compute from zones
  let allGeometries = [];

  if (boundary) {
    const boundaryRings = extractRings(boundary);
    allGeometries.push(...boundaryRings);
  }

  for (const zone of zones || []) {
    const geom = zone.geometry || zone.boundary;
    if (geom) {
      allGeometries.push(...extractRings(geom));
    }
  }

  if (allGeometries.length === 0) {
    return { boundarySvg: null, zoneSvgs: [], valid: false };
  }

  // Compute unified bounding box from all geometry
  const bbox = computeBBox(allGeometries);
  const lngRange = bbox.maxLng - bbox.minLng || 0.0001;
  const latRange = bbox.maxLat - bbox.minLat || 0.0001;
  const drawableWidth = svgWidth - padding * 2;
  const drawableHeight = svgHeight - padding * 2;

  // Helper: convert a ring using the unified bbox
  function ringToPath(ring) {
    const points = ring.map(([lng, lat]) => {
      const nx = (lng - bbox.minLng) / lngRange;
      const ny = (bbox.maxLat - lat) / latRange;
      return `${(nx * drawableWidth + padding).toFixed(2)},${(ny * drawableHeight + padding).toFixed(2)}`;
    });
    return `M${points.join('L')}Z`;
  }

  // Helper: convert centroid using unified bbox
  function ringCentroid(ring) {
    const c = computeCentroid(ring);
    const nx = (c[0] - bbox.minLng) / lngRange;
    const ny = (bbox.maxLat - c[1]) / latRange;
    return {
      x: nx * drawableWidth + padding,
      y: ny * drawableHeight + padding,
    };
  }

  // Build boundary SVG
  let boundarySvg = null;
  if (boundary) {
    const boundaryRings = extractRings(boundary);
    if (boundaryRings.length > 0) {
      boundarySvg = {
        path: ringToPath(boundaryRings[0]),
        centroid: ringCentroid(boundaryRings[0]),
      };
    }
  }

  // Build zone SVGs
  const zoneSvgs = (zones || []).map((zone) => {
    const geom = zone.geometry || zone.boundary;
    const rings = extractRings(geom);

    if (rings.length === 0) {
      return { ...zone, paths: [], centroid: { x: 0, y: 0 }, valid: false };
    }

    const paths = rings.map((ring) => ringToPath(ring));
    const centroid = ringCentroid(rings[0]);

    return {
      ...zone,
      paths,
      centroid,
      valid: true,
    };
  });

  return { boundarySvg, zoneSvgs, valid: true };
}