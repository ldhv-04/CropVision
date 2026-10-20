/**
 * Admin Boundary MapLibre Sources & Layers.
 * Complies with Rule 2.1 (<= 300 LOC).
 */

import {
  BOUNDARY_LAYER_CONFIG,
  emptyBoundaryCollection,
} from '../../utils/loadBoundaryGeoJSON';

export function addAdminBoundarySources(map) {
  Object.values(BOUNDARY_LAYER_CONFIG).forEach((config) => {
    if (!map.getSource(config.sourceId)) {
      map.addSource(config.sourceId, {
        type: 'geojson',
        data: emptyBoundaryCollection(),
      });
    }
  });
}

export function addAdminBoundaryLayers(map) {
  Object.values(BOUNDARY_LAYER_CONFIG).forEach((config) => {
    if (!map.getLayer(config.lineLayerId)) {
      map.addLayer({
        id: config.lineLayerId,
        type: 'line',
        source: config.sourceId,
        minzoom: config.minZoom,
        maxzoom: config.maxZoom,
        layout: {
          visibility: 'none',
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': config.lineColor,
          'line-width': config.lineWidth,
          'line-opacity': config.lineOpacity,
        },
      });
    }

    if (!map.getLayer(config.labelLayerId)) {
      map.addLayer({
        id: config.labelLayerId,
        type: 'symbol',
        source: config.sourceId,
        minzoom: config.labelMinZoom,
        maxzoom: config.maxZoom,
        layout: {
          visibility: 'none',
          'text-field': ['coalesce', ['get', config.labelKey], ''],
          'text-size': 11,
          'text-anchor': 'center',
          'text-max-width': 8,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': config.lineColor,
          'text-halo-color': 'rgba(255, 255, 255, 0.85)',
          'text-halo-width': 1.5,
        },
      });
    }
  });
}
