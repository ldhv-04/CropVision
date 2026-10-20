/**
 * StationMapCanvasMapLibre — MapLibre GL Web Map Container.
 * Modular orchestrator component conforming to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { buildRasterStyle, MAP_MIN_ZOOM, MAP_MAX_ZOOM } from './canvas/mapStyles';
import { addAllSourcesAndLayers } from './canvas/fieldLayers';
import { useMapSync } from './canvas/useMapSync';
import { rehydrateBoundarySourcesFromCache } from '../../utils/loadBoundaryGeoJSON';
import { fieldsToFeatureCollection } from '../../utils/fieldToGeoJSON';

export default function StationMapCanvasMapLibre({
  fields = [],
  selectedFieldId,
  hoveredFieldId,
  activeTool,
  drawState,
  editState,
  layers,
  adminLayers,
  center = [10.03, 105.78],
  zoom = 13,
  onFieldSelect,
  onFieldHover,
  onMapClick,
  onMapMove,
  onEditVertexDrag,
  onMapRef,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const isMountedRef = useRef(false);
  const isProgrammaticMoveRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const viewportUpdateTimerRef = useRef(null);
  const pendingFieldsRef = useRef(null);

  const activeToolRef = useRef(activeTool);
  const onFieldSelectRef = useRef(onFieldSelect);
  const onFieldHoverRef = useRef(onFieldHover);
  const onMapClickRef = useRef(onMapClick);
  const onEditVertexDragRef = useRef(onEditVertexDrag);
  const adminLayersRef = useRef(adminLayers);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { onFieldSelectRef.current = onFieldSelect; }, [onFieldSelect]);
  useEffect(() => { onFieldHoverRef.current = onFieldHover; }, [onFieldHover]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onEditVertexDragRef.current = onEditVertexDrag; }, [onEditVertexDrag]);
  useEffect(() => { adminLayersRef.current = adminLayers; }, [adminLayers]);

  const mapStyle = useMemo(() => {
    return buildRasterStyle(layers?.baseMap || 'osm');
  }, [layers?.baseMap]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current || isMountedRef.current) return;
    isMountedRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [center[1], center[0]],
      zoom: Math.min(zoom, MAP_MAX_ZOOM),
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: true,
      fadeDuration: 0,
      trackResize: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      addAllSourcesAndLayers(map);
      if (pendingFieldsRef.current && pendingFieldsRef.current.length > 0) {
        const src = map.getSource('fields-source');
        if (src) src.setData(fieldsToFeatureCollection(pendingFieldsRef.current));
      }
    });

    map.on('click', (e) => {
      const hits = map.queryRenderedFeatures(e.point, { layers: ['field-fill-layer'] });
      if (hits.length > 0 && onFieldSelectRef.current) {
        const fid = hits[0].properties?.id;
        if (fid) return onFieldSelectRef.current(fid);
      }
      if (activeToolRef.current === 'draw' && onMapClickRef.current) {
        onMapClickRef.current([e.lngLat.lat, e.lngLat.lng]);
      }
    });

    map.on('mouseenter', 'field-fill-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const hid = e.features?.[0]?.properties?.id;
      if (hid && onFieldHoverRef.current) onFieldHoverRef.current(hid);
    });

    map.on('mouseleave', 'field-fill-layer', () => {
      map.getCanvas().style.cursor = activeToolRef.current === 'draw' ? 'crosshair' : 'grab';
      if (onFieldHoverRef.current) onFieldHoverRef.current(null);
    });

    map.on('movestart', () => {
      if (!isProgrammaticMoveRef.current) isUserInteractingRef.current = true;
    });

    map.on('moveend', () => {
      if (isProgrammaticMoveRef.current) {
        isProgrammaticMoveRef.current = false;
        return;
      }
      if (isUserInteractingRef.current) {
        isUserInteractingRef.current = false;
        const c = map.getCenter();
        const z = map.getZoom();
        clearTimeout(viewportUpdateTimerRef.current);
        viewportUpdateTimerRef.current = setTimeout(() => {
          if (onMapMove) onMapMove([c.lat, c.lng], Math.round(z * 10) / 10);
        }, 100);
      }
    });

    mapRef.current = map;
    if (onMapRef) onMapRef(map);

    const observer = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      clearTimeout(viewportUpdateTimerRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isMountedRef.current = false;
      }
    };
  }, []);

  useMapSync({
    mapRef,
    fields,
    selectedFieldId,
    hoveredFieldId,
    drawState,
    editState,
    adminLayers,
    pendingFieldsRef,
  });

  if (Platform.OS !== 'web') {
    const StationMapCanvas = require('./StationMapCanvas').default;
    return <StationMapCanvas fields={fields} selectedFieldId={selectedFieldId} center={center} zoom={zoom} />;
  }

  const cursorStyle = activeTool === 'draw' ? 'crosshair' : 'grab';

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        cursor: cursorStyle,
      }}
    />
  );
}
