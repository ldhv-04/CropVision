/**
 * MapLibre Synchronization Hooks for Fields, Selection, Layers & Draw/Edit States.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import { useEffect } from 'react';
import {
  fieldsToFeatureCollection,
  drawVerticesToGeoJSON,
  editVerticesToGeoJSON,
  emptyFeatureCollection,
} from '../../utils/fieldToGeoJSON';
import { BOUNDARY_LAYER_CONFIG, loadBoundaryGeoJSON } from '../../utils/loadBoundaryGeoJSON';

export function useMapSync({
  mapRef,
  fields,
  selectedFieldId,
  hoveredFieldId,
  drawState,
  editState,
  adminLayers,
  pendingFieldsRef,
}) {
  // Sync fields GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pendingFieldsRef.current = fields;
    if (!map.isStyleLoaded()) return;

    const source = map.getSource('fields-source');
    if (source && typeof source.setData === 'function') {
      source.setData(fieldsToFeatureCollection(fields));
    }
  }, [fields, mapRef, pendingFieldsRef]);

  // Sync selection highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const filterVal = selectedFieldId || '';

    if (map.getLayer('field-highlight-layer')) {
      map.setFilter('field-highlight-layer', ['==', 'id', filterVal]);
      map.setPaintProperty('field-highlight-layer', 'fill-opacity', selectedFieldId ? 0.15 : 0.0);
    }
    if (map.getLayer('field-highlight-border-layer')) {
      map.setFilter('field-highlight-border-layer', ['==', 'id', filterVal]);
      map.setPaintProperty('field-highlight-border-layer', 'line-opacity', selectedFieldId ? 1.0 : 0.0);
      map.setPaintProperty('field-highlight-border-layer', 'line-width', selectedFieldId ? 3 : 0);
    }
  }, [selectedFieldId, mapRef]);

  // Sync hover highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('field-hover-layer')) {
      const activeHoverId = hoveredFieldId && hoveredFieldId !== selectedFieldId ? hoveredFieldId : '';
      map.setFilter('field-hover-layer', ['==', 'id', activeHoverId]);
      map.setPaintProperty('field-hover-layer', 'fill-opacity', activeHoverId ? 0.35 : 0.0);
    }
  }, [hoveredFieldId, selectedFieldId, mapRef]);

  // Sync draw preview state
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('draw-source');
    if (!src) return;

    if (drawState && drawState.vertices && drawState.vertices.length > 0) {
      src.setData(drawVerticesToGeoJSON(drawState.vertices));
    } else {
      src.setData(emptyFeatureCollection());
    }
  }, [drawState, mapRef]);

  // Sync edit preview state
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('edit-source');
    if (!src) return;

    if (editState && editState.vertices && editState.vertices.length > 0) {
      src.setData(editVerticesToGeoJSON(editState.vertices));
    } else {
      src.setData(emptyFeatureCollection());
    }
  }, [editState, mapRef]);

  // Sync admin boundary layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !adminLayers) return;

    Object.entries(BOUNDARY_LAYER_CONFIG).forEach(async ([layerKey, cfg]) => {
      const isVisible = adminLayers[layerKey] ?? cfg.defaultVisible;
      const visibilityStr = isVisible ? 'visible' : 'none';

      if (isVisible) {
        try {
          const geojson = await loadBoundaryGeoJSON(layerKey);
          const src = map.getSource(cfg.sourceId);
          if (src && geojson) src.setData(geojson);
        } catch (err) {
          console.error('[BOUNDARY_ERROR] Failed loading layer:', layerKey, err.message);
        }
      }

      if (map.getLayer(cfg.lineLayerId)) {
        map.setLayoutProperty(cfg.lineLayerId, 'visibility', visibilityStr);
      }
      if (map.getLayer(cfg.labelLayerId)) {
        map.setLayoutProperty(cfg.labelLayerId, 'visibility', visibilityStr);
      }
    });
  }, [adminLayers, mapRef]);
}
