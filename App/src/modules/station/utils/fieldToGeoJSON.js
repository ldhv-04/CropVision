/**
 * fieldToGeoJSON.js — Convert field data to GeoJSON FeatureCollection for MapLibre.
 *
 * Converts an array of field objects (from API/Zustand) into a GeoJSON
 * FeatureCollection suitable for use as a MapLibre source.
 *
 * Each feature includes:
 * - Geometry: Polygon from field.boundary
 * - Properties: id, name, status, crop_type, color, area, etc.
 */

import { extractPolygonCoords, calculateAreaHectares, calculateCentroid } from './fieldGeometry';

/**
 * Convert a single field to a GeoJSON Feature.
 *
 * @param {Object} field - Field object with boundary (GeoJSON or JSONB string)
 * @returns {Object|null} GeoJSON Feature or null if no valid geometry
 */
export function fieldToFeature(field) {
  if (!field || !field.boundary) {
    console.warn('[GEOJSON_WARN] skipped field — missing boundary', {
      hasField: Boolean(field),
      hasBoundary: Boolean(field?.boundary),
    });
    return null;
  }

  let geo;
  try {
    geo = typeof field.boundary === 'string' ? JSON.parse(field.boundary) : field.boundary;
  } catch (e) {
    console.warn('[GEOJSON_WARN] Failed to parse field boundary', { errorMessage: e?.message });
    return null;
  }

  if (!geo || !geo.type || !geo.coordinates) {
    console.warn('[GEOJSON_WARN] skipped field due to invalid geometry', {
      hasGeo: Boolean(geo),
      type: geo?.type,
      hasCoordinates: Boolean(geo?.coordinates),
    });
    return null;
  }

  // Ensure the polygon ring is closed
  let coordinates;
  if (geo.type === 'Polygon') {
    coordinates = geo.coordinates;
    // Ensure ring closure
    if (coordinates[0] && coordinates[0].length > 0) {
      const ring = coordinates[0];
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates = [[...ring, first]];
      }
    }
  } else if (geo.type === 'MultiPolygon') {
    coordinates = geo.coordinates;
  } else {
    console.warn('[GEOJSON_WARN] Unsupported geometry type:', geo.type);
    return null;
  }

  // Calculate area from [lat, lng] pairs
  const latlngs = extractPolygonCoords(field.boundary);
  const area = calculateAreaHectares(latlngs);
  const centroid = calculateCentroid(latlngs);

  const feature = {
    type: 'Feature',
    id: String(field.id),
    geometry: {
      type: geo.type,
      coordinates,
    },
    properties: {
      id: String(field.id),
      name: field.name || 'Unnamed',
      status: field.status || 'ACTIVE',
      crop_type: field.crop_type || '',
      color: field.color || '#4CAF50',
      area_hectares: area,
      centroid_lat: centroid[0],
      centroid_lng: centroid[1],
      growth_stage: field.growth_stage || '',
      planting_date: field.planting_date || null,
      notes: field.notes || '',
    },
  };

  return feature;
}

/**
 * Convert an array of fields into a GeoJSON FeatureCollection.
 *
 * @param {Array} fields - Array of field objects
 * @returns {Object} GeoJSON FeatureCollection
 */
export function fieldsToFeatureCollection(fields) {
  if (!fields || !Array.isArray(fields)) {
    return emptyFeatureCollection();
  }

  const features = [];
  for (const field of fields) {
    const feature = fieldToFeature(field);
    if (feature) {
      features.push(feature);
    }
  }


  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert draw vertices (in [lat, lng] format) to a GeoJSON Feature
 * for the draw preview layer.
 *
 * @param {Array<[number, number]>} vertices - Array of [lat, lng] pairs
 * @returns {Object} GeoJSON FeatureCollection with a single Polygon feature
 */
export function drawVerticesToGeoJSON(vertices) {
  if (!vertices || vertices.length < 2) {
    return emptyFeatureCollection();
  }

  // Convert [lat, lng] to [lng, lat] for GeoJSON
  const coords = vertices.map(([lat, lng]) => [lng, lat]);

  const features = [];

  // Line string connecting vertices
  features.push({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
    properties: { type: 'draw-line' },
  });

  // Point features for vertices
  coords.forEach((coord, i) => {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coord,
      },
      properties: {
        type: 'draw-vertex',
        index: i,
        isFirst: i === 0,
      },
    });
  });

  // Polygon fill (if ≥ 3 points)
  if (vertices.length >= 3) {
    const closedCoords = [...coords, coords[0]]; // close the ring
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [closedCoords],
      },
      properties: { type: 'draw-polygon' },
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Convert edit vertices (in [lat, lng] format) to a GeoJSON FeatureCollection
 * for the edit preview layer.
 *
 * @param {Array<[number, number]>} vertices - Array of [lat, lng] pairs
 * @returns {Object} GeoJSON FeatureCollection
 */
export function editVerticesToGeoJSON(vertices) {
  if (!vertices || vertices.length < 3) {
    return emptyFeatureCollection();
  }

  // Convert [lat, lng] to [lng, lat] for GeoJSON
  const coords = vertices.map(([lat, lng]) => [lng, lat]);
  const closedCoords = [...coords, coords[0]];

  const features = [];

  // Polygon fill
  features.push({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [closedCoords],
    },
    properties: { type: 'edit-polygon' },
  });

  // Editable vertex points
  coords.forEach((coord, i) => {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coord,
      },
      properties: {
        type: 'edit-vertex',
        index: i,
        lat: vertices[i][0],
        lng: vertices[i][1],
      },
    });
  });

  return { type: 'FeatureCollection', features };
}

/**
 * Create an empty GeoJSON FeatureCollection.
 * @returns {Object}
 */
export function emptyFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [],
  };
}