/**
 * MapLibre Field, Draw & Edit Layer Definitions.
 * Complies with Rule 2.1 (<= 300 LOC).
 */

import { emptyFeatureCollection } from '../../utils/fieldToGeoJSON';
import { addAdminBoundarySources, addAdminBoundaryLayers } from './boundaryLayers';

export function addFieldLayers(map) {
  if (!map.getSource('fields-source')) {
    map.addSource('fields-source', {
      type: 'geojson',
      data: emptyFeatureCollection(),
    });
  }

  if (!map.getLayer('field-fill-layer')) {
    map.addLayer({
      id: 'field-fill-layer',
      type: 'fill',
      source: 'fields-source',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'status'], 'INACTIVE'], '#9E9E9E',
          ['==', ['get', 'status'], 'FALLOW'], '#795548',
          '#4CAF50',
        ],
        'fill-opacity': 0.25,
      },
    });
  }

  if (!map.getLayer('field-border-layer')) {
    map.addLayer({
      id: 'field-border-layer',
      type: 'line',
      source: 'fields-source',
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'status'], 'INACTIVE'], '#9E9E9E',
          ['==', ['get', 'status'], 'FALLOW'], '#795548',
          '#4CAF50',
        ],
        'line-width': 2,
        'line-opacity': 0.85,
      },
    });
  }

  if (!map.getLayer('field-highlight-layer')) {
    map.addLayer({
      id: 'field-highlight-layer',
      type: 'fill',
      source: 'fields-source',
      paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.0 },
      filter: ['==', 'id', ''],
    });
  }

  if (!map.getLayer('field-highlight-border-layer')) {
    map.addLayer({
      id: 'field-highlight-border-layer',
      type: 'line',
      source: 'fields-source',
      paint: { 'line-color': '#ffffff', 'line-width': 3, 'line-opacity': 0.0 },
      filter: ['==', 'id', ''],
    });
  }

  if (!map.getLayer('field-hover-layer')) {
    map.addLayer({
      id: 'field-hover-layer',
      type: 'fill',
      source: 'fields-source',
      paint: { 'fill-color': '#1976D2', 'fill-opacity': 0.0 },
      filter: ['==', 'id', ''],
    });
  }
}

export function addDrawLayers(map) {
  if (!map.getSource('draw-source')) {
    map.addSource('draw-source', {
      type: 'geojson',
      data: emptyFeatureCollection(),
    });
  }

  if (!map.getLayer('draw-polygon-layer')) {
    map.addLayer({
      id: 'draw-polygon-layer',
      type: 'fill',
      source: 'draw-source',
      paint: { 'fill-color': '#2196F3', 'fill-opacity': 0.15 },
      filter: ['==', ['get', 'type'], 'draw-polygon'],
    });
  }

  if (!map.getLayer('draw-line-layer')) {
    map.addLayer({
      id: 'draw-line-layer',
      type: 'line',
      source: 'draw-source',
      paint: {
        'line-color': '#2196F3',
        'line-width': 2,
        'line-dasharray': [6, 4],
        'line-opacity': 0.8,
      },
      filter: ['==', ['get', 'type'], 'draw-line'],
    });
  }

  if (!map.getLayer('draw-vertex-layer')) {
    map.addLayer({
      id: 'draw-vertex-layer',
      type: 'circle',
      source: 'draw-source',
      paint: {
        'circle-radius': ['case', ['get', 'isFirst'], 7, 5],
        'circle-color': ['case', ['get', 'isFirst'], '#4CAF50', '#2196F3'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
      filter: ['==', ['get', 'type'], 'draw-vertex'],
    });
  }
}

export function addEditLayers(map) {
  if (!map.getSource('edit-source')) {
    map.addSource('edit-source', {
      type: 'geojson',
      data: emptyFeatureCollection(),
    });
  }

  if (!map.getLayer('edit-polygon-layer')) {
    map.addLayer({
      id: 'edit-polygon-layer',
      type: 'fill',
      source: 'edit-source',
      paint: { 'fill-color': '#FF9800', 'fill-opacity': 0.15 },
      filter: ['==', ['get', 'type'], 'edit-polygon'],
    });
  }

  if (!map.getLayer('edit-border-layer')) {
    map.addLayer({
      id: 'edit-border-layer',
      type: 'line',
      source: 'edit-source',
      paint: { 'line-color': '#FF9800', 'line-width': 2, 'line-opacity': 0.8 },
      filter: ['==', ['get', 'type'], 'edit-polygon'],
    });
  }

  if (!map.getLayer('edit-vertex-layer')) {
    map.addLayer({
      id: 'edit-vertex-layer',
      type: 'circle',
      source: 'edit-source',
      paint: {
        'circle-radius': 7,
        'circle-color': '#FF9800',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-opacity': 1,
      },
      filter: ['==', ['get', 'type'], 'edit-vertex'],
    });
  }
}

export function addAllSourcesAndLayers(map) {
  addAdminBoundarySources(map);
  addAdminBoundaryLayers(map);
  addFieldLayers(map);
  addDrawLayers(map);
  addEditLayers(map);
}
