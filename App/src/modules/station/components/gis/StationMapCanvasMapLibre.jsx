/**
 * StationMapCanvasMapLibre — MapLibre GL-based map component for Station Field Management.
 *
 * Replaces the Leaflet (react-leaflet) implementation with MapLibre GL + GeoJSON + WebGL.
 *
 * Architecture:
 * - Map instance mounted ONCE via useRef (never recreated on React re-renders)
 * - GeoJSON sources updated imperatively when fields change
 * - Layers defined once on style load
 * - Draw/Edit overlays via separate GeoJSON sources
 * - Viewport updates: Map → Store only (never Store → Map loop)
 * - ResizeObserver for stable tile rendering
 *
 * Debug logs prefixed with [MAP], [GEOJSON], [DRAW], [EDIT], [VIEWPORT].
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  fieldsToFeatureCollection,
  drawVerticesToGeoJSON,
  editVerticesToGeoJSON,
  emptyFeatureCollection,
} from '../../utils/fieldToGeoJSON';
import { extractPolygonCoords, calculateBounds, calculateAreaHectares, formatArea } from '../../utils/fieldGeometry';
import { loadBoundaryGeoJSON } from '../../utils/loadBoundaryGeoJSON';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM, SOURCE_MAX_ZOOM, FIELD_FOCUS_ZOOM, clampZoom } from '../../config/mapConfig';

// ── Tile style URLs ──────────────────────────────────────────
const TILE_STYLES = {
  osm: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  terrain: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

// Fallback: use raster tiles if vector style fails
function buildRasterStyle(baseMap) {
  const urls = {
    osm: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
  };
  const attributions = {
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    satellite: '&copy; Esri',
    terrain: '&copy; OpenTopoMap',
  };
  console.log("[TILE STYLE] building raster style for:", baseMap,
    "| source.maxzoom:", SOURCE_MAX_ZOOM,
    "| map.maxZoom:", MAP_MAX_ZOOM);
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [urls[baseMap] || urls.osm],
        tileSize: 256,
        // Source maxzoom = max tile zoom available from the provider.
        // This does NOT limit the camera — it only controls which tile
        // z-level is requested. Set to provider limit (19 for OSM/Esri).
        maxzoom: SOURCE_MAX_ZOOM,
        attribution: attributions[baseMap] || attributions.osm,
      },
    },
    layers: [
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles',
        // IMPORTANT: Do NOT set minzoom/maxzoom on the layer.
        // In MapLibre, layer maxzoom is an EXCLUSIVE upper bound —
        // the layer stops rendering exactly at that zoom, causing
        // a blank map. The map's minZoom/maxZoom handles camera limits.
      },
    ],
  };
}

// ── Status colors (matching existing system) ─────────────────
const STATUS_COLORS = {
  ACTIVE: '#4CAF50',
  INACTIVE: '#9E9E9E',
  FALLOW: '#795548',
};

export default function StationMapCanvasMapLibre({
  fields = [],
  selectedFieldId,
  hoveredFieldId,
  activeTool,
  drawState,
  editState,
  layers,
  center,
  zoom,
  onFieldSelect,
  onFieldHover,
  onMapClick,
  onMapMove,
  onEditVertexDrag,
  onMapRef,
}) {
  console.group("GIS AUDIT (MapLibre)");
  console.log("Fields loaded:", fields.length);
  console.log("Viewport:", { center, zoom });
  console.log("Selected field:", selectedFieldId);
  console.log("Active tool:", activeTool);
  console.groupEnd();

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const isMountedRef = useRef(false);
  const isProgrammaticMoveRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const viewportUpdateTimerRef = useRef(null);
  const initialFitDoneRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const fieldsRef = useRef(fields);

  // Refs for values accessed in mount-once event handlers (avoid stale closures)
  const activeToolRef = useRef(activeTool);
  const onFieldSelectRef = useRef(onFieldSelect);
  const onFieldHoverRef = useRef(onFieldHover);
  const onMapClickRef = useRef(onMapClick);
  const onEditVertexDragRef = useRef(onEditVertexDrag);

  // Keep refs in sync with props
  useEffect(() => { fieldsRef.current = fields; }, [fields]);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { onFieldSelectRef.current = onFieldSelect; }, [onFieldSelect]);
  useEffect(() => { onFieldHoverRef.current = onFieldHover; }, [onFieldHover]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onEditVertexDragRef.current = onEditVertexDrag; }, [onEditVertexDrag]);

  // ── Tile style (memoized to avoid unnecessary style changes) ──
  const mapStyle = useMemo(() => {
    const baseMap = layers?.baseMap || 'osm';
    // Use raster tiles for reliability (vector styles may fail with some CDNs)
    return buildRasterStyle(baseMap);
  }, [layers?.baseMap]);

  // ════════════════════════════════════════════════════════════
  // STEP 3: Initialize MapLibre map instance ONCE
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log("[MAP] initializing");
    if (mapRef.current || !containerRef.current) return;

    // Prevent double-init in React StrictMode
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [center[1], center[0]], // MapLibre: [lng, lat]
      zoom: clampZoom(zoom), // Clamp initial zoom
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: true,
      fadeDuration: 0, // Disable fade to prevent tile flickering
      trackResize: false, // We handle resize ourselves
    });

    console.log("[ZOOM_DEBUG] map initialized", {
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      currentZoom: clampZoom(zoom),
      center: [center[1], center[0]],
    });

    // Suppress tile loading errors (CORS/network issues for edge tiles)
    map.on('error', (e) => {
      // Only log non-tile errors; tile errors are expected for edge cases
      if (e.error?.message?.includes('fetch') || e.error?.status === 0) {
        console.warn("[MAP] tile fetch error (non-critical):", e.error?.message);
      } else {
        console.error("[MAP] error:", e.error);
      }
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      console.log("[MAP] style loaded");

      // ── Add administrative boundary sources & layers ─────────
      addBoundarySourcesAndLayers(map, layers || {}, boundariesLoadedRef.current);

      // Mark map as ready (triggers fields source population)
      setMapReady(true);

      // ── Add field polygons source & layers ──────────────────
      map.addSource('fields-source', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      });

      // Fill layer: field polygon area
      map.addLayer({
        id: 'field-fill-layer',
        type: 'fill',
        source: 'fields-source',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'status'], 'INACTIVE'], '#9E9E9E',
            ['==', ['get', 'status'], 'FALLOW'], '#795548',
            '#4CAF50', // default ACTIVE
          ],
          'fill-opacity': 0.25,
        },
      });

      // Border layer: field boundary outline
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

      // Highlight layer: selected field (on top)
      map.addLayer({
        id: 'field-highlight-layer',
        type: 'fill',
        source: 'fields-source',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0.0,
        },
        filter: ['==', 'id', ''], // initially nothing selected
      });

      map.addLayer({
        id: 'field-highlight-border-layer',
        type: 'line',
        source: 'fields-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
          'line-opacity': 0.0,
        },
        filter: ['==', 'id', ''],
      });

      // Hover highlight layer: opacity 0.6 for hovered field
      map.addLayer({
        id: 'field-hover-layer',
        type: 'fill',
        source: 'fields-source',
        paint: {
          'fill-color': '#1976D2',
          'fill-opacity': 0.0,
        },
        filter: ['==', 'id', ''],
      });

      // ── Add draw preview source & layers ────────────────────
      map.addSource('draw-source', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      });

      // Draw polygon fill
      map.addLayer({
        id: 'draw-polygon-layer',
        type: 'fill',
        source: 'draw-source',
        paint: {
          'fill-color': '#2196F3',
          'fill-opacity': 0.15,
        },
        filter: ['==', ['get', 'type'], 'draw-polygon'],
      });

      // Draw line (connecting vertices)
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

      // Draw vertex circles
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

      // ── Add edit preview source & layers ────────────────────
      map.addSource('edit-source', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      });

      // Edit polygon fill
      map.addLayer({
        id: 'edit-polygon-layer',
        type: 'fill',
        source: 'edit-source',
        paint: {
          'fill-color': '#FF9800',
          'fill-opacity': 0.15,
        },
        filter: ['==', ['get', 'type'], 'edit-polygon'],
      });

      // Edit polygon border
      map.addLayer({
        id: 'edit-border-layer',
        type: 'line',
        source: 'edit-source',
        paint: {
          'line-color': '#FF9800',
          'line-width': 2,
          'line-opacity': 0.8,
        },
        filter: ['==', ['get', 'type'], 'edit-polygon'],
      });

      // Edit vertex circles
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

      // ── Area label for draw preview ─────────────────────────
      map.addLayer({
        id: 'draw-area-label',
        type: 'symbol',
        source: 'draw-source',
        layout: {
          'text-field': '',
          'text-size': 12,
          'text-anchor': 'center',
          'text-offset': [0, -1],
        },
        paint: {
          'text-color': '#2196F3',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
        filter: ['==', ['get', 'type'], 'draw-polygon'],
      });

      console.log("[MAP] mounted — all layers added");

      // ── Populate fields source immediately if fields exist ───
      // This handles the race condition where fields arrive before map loads
      const currentFields = fieldsRef.current;
      if (currentFields && currentFields.length > 0) {
        const initialGeojson = fieldsToFeatureCollection(currentFields);
        const fieldsSrc = map.getSource('fields-source');
        if (fieldsSrc) {
          fieldsSrc.setData(initialGeojson);
          console.log("[MAP] initial fields populated —", initialGeojson.features.length, "features");
        }
      }
    });

    // ── Click handler (uses refs to avoid stale closures) ─────
    map.on('click', (e) => {
      // Check if clicked on a field feature
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['field-fill-layer'],
      });

      if (features.length > 0) {
        const clickedId = features[0].properties?.id;
        if (clickedId && onFieldSelectRef.current) {
          onFieldSelectRef.current(clickedId);
          return;
        }
      }

      // Otherwise, if draw tool is active, add a vertex
      if (activeToolRef.current === 'draw' && onMapClickRef.current) {
        const { lng, lat } = e.lngLat;
        console.log("[DRAW] coordinates", [lat, lng]);
        onMapClickRef.current([lat, lng]);
      }
    });

    // Change cursor on hover over fields
    map.on('mouseenter', 'field-fill-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      // Update hovered field in store for explorer sync
      if (e.features && e.features.length > 0) {
        const hoveredId = e.features[0].properties?.id;
        if (hoveredId && onFieldHoverRef.current) {
          onFieldHoverRef.current(hoveredId);
        }
      }
    });
    map.on('mouseleave', 'field-fill-layer', () => {
      map.getCanvas().style.cursor = activeToolRef.current === 'draw' ? 'crosshair' : 'grab';
      if (onFieldHoverRef.current) {
        onFieldHoverRef.current(null);
      }
    });

    // ── Viewport events (Map → Store, no loop) ────────────────
    map.on('movestart', () => {
      if (!isProgrammaticMoveRef.current) {
        isUserInteractingRef.current = true;
      }
    });

    map.on('zoomend', () => {
      console.log("[ZOOM_DEBUG] zoom changed", {
        zoom: map.getZoom(),
      });
    });

    map.on('moveend', () => {
      console.log("[VIEWPORT] moveend fired, programmatic:", isProgrammaticMoveRef.current);
      if (isProgrammaticMoveRef.current) {
        isProgrammaticMoveRef.current = false;
        console.log("[VIEWPORT] skipped (programmatic)");
        return;
      }
      if (isUserInteractingRef.current) {
        isUserInteractingRef.current = false;
        const c = map.getCenter();
        const z = map.getZoom();
        // Debounce to prevent rapid-fire updates
        if (viewportUpdateTimerRef.current) {
          clearTimeout(viewportUpdateTimerRef.current);
        }
        viewportUpdateTimerRef.current = setTimeout(() => {
          console.log("[VIEWPORT] updated");
          onMapMove([c.lat, c.lng], Math.round(z * 10) / 10);
        }, 100);
      }
    });

    // ── Edit vertex drag via MapLibre ──────────────────────────
    // We use canvas events for edit vertex dragging
    let isDraggingVertex = false;
    let dragVertexIndex = -1;

    map.on('mousedown', 'edit-vertex-layer', (e) => {
      if (activeToolRef.current !== 'edit') return;
      e.preventDefault();
      isDraggingVertex = true;
      dragVertexIndex = e.features?.[0]?.properties?.index ?? -1;
      map.getCanvas().style.cursor = 'grabbing';
      map.dragPan.disable();
    });

    map.on('mousemove', (e) => {
      if (!isDraggingVertex || dragVertexIndex < 0) return;
      // Real-time vertex position update would be too expensive,
      // we just update cursor
    });

    map.on('mouseup', (e) => {
      if (isDraggingVertex && dragVertexIndex >= 0) {
        const { lng, lat } = e.lngLat;
        if (onEditVertexDragRef.current) {
          onEditVertexDragRef.current(dragVertexIndex, [lat, lng]);
          console.log("[EDIT] vertex", dragVertexIndex, "dragged to", lat, lng);
        }
      }
      isDraggingVertex = false;
      dragVertexIndex = -1;
      map.getCanvas().style.cursor = activeToolRef.current === 'draw' ? 'crosshair' : 'grab';
      map.dragPan.enable();
    });

    mapRef.current = map;

    // Expose map instance to parent for imperative flyTo calls
    if (onMapRef) {
      onMapRef(map);
    }

    // ── ResizeObserver for tile rendering fix ──────────────────
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          console.log("[MAP] width", width, "height", height);
          if (width > 0 && height > 0 && mapRef.current) {
            console.log("[MAP] resize triggered");
            mapRef.current.resize();
          }
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Cleanup on unmount
    return () => {
      observer.disconnect();
      if (viewportUpdateTimerRef.current) {
        clearTimeout(viewportUpdateTimerRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isMountedRef.current = false;
      }
    };
  }, []); // Empty deps — mount ONCE only

  // ════════════════════════════════════════════════════════════
  // STEP 5: Update field GeoJSON source when fields change
  // Re-runs when fields change OR when map becomes ready
  // (fixes race condition where fields arrive before map loads)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      console.log("[MAP_SOURCE] skipping source update — map not ready");
      return;
    }

    console.time("geojson-update");
    console.log("[FIELD_FLOW] converting fields to FeatureCollection", fields.length);
    const geojson = fieldsToFeatureCollection(fields);

    console.log("[MAP_SOURCE] updating field source", {
      featureCount: geojson.features.length,
    });

    const source = map.getSource('fields-source');
    if (source) {
      source.setData(geojson);
      console.log("[MAP] source loaded —", geojson.features.length, "features");
      console.log("[MAP] polygon layer rendered");
    } else {
      console.warn("[MAP_SOURCE] fields-source not found — layers may not be added yet");
    }
    console.timeEnd("geojson-update");
  }, [fields, mapReady]);

  // ── Update selected field highlight ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const filterVal = selectedFieldId || '';

    console.log("[FIELD_FLOW] selected field id", selectedFieldId);

    // Check if the selected field exists in the source
    if (selectedFieldId) {
      const source = map.getSource('fields-source');
      if (source && source._data) {
        const found = source._data.features?.some(f => f.properties?.id === selectedFieldId);
        console.log("[MAP_SOURCE] selected field source update", {
          selectedFieldId,
          found,
          featureCount: source._data.features?.length,
        });
      }
    }

    // Highlight selected field: stroke-width 3, opacity 1
    if (map.getLayer('field-highlight-layer')) {
      map.setFilter('field-highlight-layer', ['==', 'id', filterVal]);
      map.setPaintProperty(
        'field-highlight-layer',
        'fill-opacity',
        selectedFieldId ? 0.15 : 0.0
      );
    }
    if (map.getLayer('field-highlight-border-layer')) {
      map.setFilter('field-highlight-border-layer', ['==', 'id', filterVal]);
      map.setPaintProperty(
        'field-highlight-border-layer',
        'line-opacity',
        selectedFieldId ? 1.0 : 0.0
      );
      map.setPaintProperty(
        'field-highlight-border-layer',
        'line-width',
        selectedFieldId ? 3 : 0
      );
    }

    // Unselected fields: opacity 0.25 when something is selected
    if (map.getLayer('field-fill-layer')) {
      map.setPaintProperty(
        'field-fill-layer',
        'fill-opacity',
        selectedFieldId ? 0.25 : 0.25
      );
    }
  }, [selectedFieldId]);

  // ── Update hover field highlight (opacity 0.6) ──────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const hoverFilterVal = hoveredFieldId || '';

    if (map.getLayer('field-hover-layer')) {
      map.setFilter('field-hover-layer', ['==', 'id', hoverFilterVal]);
      map.setPaintProperty(
        'field-hover-layer',
        'fill-opacity',
        hoveredFieldId ? 0.6 : 0.0
      );
    }
  }, [hoveredFieldId]);

  // ════════════════════════════════════════════════════════════
  // STEP 6: Update draw preview when draw state changes
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const drawGeoJSON = drawVerticesToGeoJSON(drawState.vertices || []);
    const source = map.getSource('draw-source');
    if (source) {
      source.setData(drawGeoJSON);
      console.log("[DRAW] geojson updated —", drawGeoJSON.features.length, "features");

      // Update area label text if we have a polygon
      if (drawState.vertices && drawState.vertices.length >= 3 && map.getLayer('draw-area-label')) {
        const area = calculateAreaHectares(drawState.vertices);
        map.setLayoutProperty('draw-area-label', 'text-field', formatArea(area));
      }
    }

    // Cursor
    if (map.getCanvas()) {
      map.getCanvas().style.cursor = activeTool === 'draw' ? 'crosshair' : 'grab';
    }
  }, [drawState.vertices, activeTool]);

  // ── Update edit preview when edit state changes ──────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const editGeoJSON = editState.isEditing
      ? editVerticesToGeoJSON(editState.currentVertices || [])
      : emptyFeatureCollection();
    const source = map.getSource('edit-source');
    if (source) {
      source.setData(editGeoJSON);
      console.log("[EDIT] source updated —", editGeoJSON.features.length, "features");
    }
  }, [editState]);

  // ════════════════════════════════════════════════════════════
  // STEP 7: Fit bounds on initial load (one-time only)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (initialFitDoneRef.current) return;
    if (!fields || fields.length === 0) return;

    // Calculate bounds from all fields
    const allCoords = [];
    for (const field of fields) {
      const fc = extractPolygonCoords(field.boundary);
      allCoords.push(...fc);
    }

    if (allCoords.length === 0) return;

    const bounds = calculateBounds(allCoords);
    if (!bounds) return;

    const [[south, west], [north, east]] = bounds;
    const mapBounds = new maplibregl.LngLatBounds(
      [west, south],
      [east, north]
    );

    initialFitDoneRef.current = true;
    isProgrammaticMoveRef.current = true;

    console.log("[ZOOM_DEBUG] fitBounds requested", {
      bounds: [[west, south], [east, north]],
      options: { padding: 40, maxZoom: FIELD_FOCUS_ZOOM, duration: 500 },
    });
    map.fitBounds(mapBounds, {
      padding: { top: 40, bottom: 40, left: 40, right: 40 },
      maxZoom: FIELD_FOCUS_ZOOM,
      duration: 500,
    });
  }, [fields]);

  // ── Update base map style when layers.baseMap changes ───────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Only change style if it's different from current
    const newStyle = buildRasterStyle(layers?.baseMap || 'osm');
    map.setStyle(newStyle);

    // After style change, re-add all sources and layers AND re-populate field data
    map.once('styledata', () => {
      // Re-add sources and layers
      addAllSourcesAndLayers(map, layers || {}, boundariesLoadedRef.current);

      // Re-populate fields source with current field data
      // (setStyle clears all sources, so we must re-populate)
      const source = map.getSource('fields-source');
      if (source && fieldsRef.current) {
        const geojson = fieldsToFeatureCollection(fieldsRef.current);
        source.setData(geojson);
        console.log("[MAP] fields re-populated after style change —", geojson.features.length, "features");
      }

      // Re-apply selected field highlight
      const currentSelectedId = selectedFieldId || '';
      if (map.getLayer('field-highlight-layer')) {
        map.setFilter('field-highlight-layer', ['==', 'id', currentSelectedId]);
        map.setPaintProperty('field-highlight-layer', 'fill-opacity', selectedFieldId ? 0.15 : 0.0);
      }
      if (map.getLayer('field-highlight-border-layer')) {
        map.setFilter('field-highlight-border-layer', ['==', 'id', currentSelectedId]);
        map.setPaintProperty('field-highlight-border-layer', 'line-opacity', selectedFieldId ? 1.0 : 0.0);
      }

      // Re-apply hover highlight
      const currentHoveredId = hoveredFieldId || '';
      if (map.getLayer('field-hover-layer')) {
        map.setFilter('field-hover-layer', ['==', 'id', currentHoveredId]);
        map.setPaintProperty('field-hover-layer', 'fill-opacity', hoveredFieldId ? 0.6 : 0.0);
      }
    });
  }, [layers?.baseMap]);

  // ── Update field layer visibility ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const visibility = layers?.fields !== false ? 'visible' : 'none';
    ['field-fill-layer', 'field-border-layer', 'field-highlight-layer', 'field-highlight-border-layer'].forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visibility);
      }
    });
  }, [layers?.fields]);

  // ── Load and toggle boundary layers based on state ────────────────
  const boundariesLoadedRef = useRef({
    province: null,
    district: null,
    ward: null,
  });

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Toggle Province Layer
    const provinceVisible = layers?.province !== false;
    console.log("[BOUNDARY_DEBUG] Set layer visibility:", "admin-province-line", provinceVisible);
    ['admin-province-line', 'admin-province-label'].forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', provinceVisible ? 'visible' : 'none');
      }
    });

    if (provinceVisible && !boundariesLoadedRef.current.province) {
      loadBoundaryGeoJSON('province', 'processed/province.boundaries.geojson').then((data) => {
        if (data && mapRef.current) {
          boundariesLoadedRef.current.province = data;
          const source = mapRef.current.getSource('admin-province-source');
          if (source) {
            source.setData(data);
            console.log("[BOUNDARY_DEBUG] Boundary source update skipped: no data change");
          }
        }
      });
    }
  }, [layers?.province]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Toggle District Layer
    const districtVisible = layers?.district === true;
    console.log("[BOUNDARY_DEBUG] Set layer visibility:", "admin-district-line", districtVisible);
    ['admin-district-line', 'admin-district-label'].forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', districtVisible ? 'visible' : 'none');
      }
    });

    if (districtVisible && !boundariesLoadedRef.current.district) {
      console.log("[BOUNDARY_DEBUG] Lazy loading layer before enabling:", 'district');
      loadBoundaryGeoJSON('district', 'processed/district.boundaries.geojson').then((data) => {
        if (data && mapRef.current) {
          boundariesLoadedRef.current.district = data;
          const source = mapRef.current.getSource('admin-district-source');
          if (source) {
            source.setData(data);
            console.log("[BOUNDARY_DEBUG] Boundary source update skipped: no data change");
          }
        }
      });
    }
  }, [layers?.district]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Toggle Ward Layer
    const wardVisible = layers?.ward === true;
    console.log("[BOUNDARY_DEBUG] Set layer visibility:", "admin-ward-line", wardVisible);
    ['admin-ward-line', 'admin-ward-label'].forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', wardVisible ? 'visible' : 'none');
      }
    });

    if (wardVisible && !boundariesLoadedRef.current.ward) {
      console.log("[BOUNDARY_DEBUG] Lazy loading layer before enabling:", 'ward');
      loadBoundaryGeoJSON('ward', 'processed/ward.boundaries.simplified.geojson').then((data) => {
        if (data && mapRef.current) {
          boundariesLoadedRef.current.ward = data;
          const source = mapRef.current.getSource('admin-ward-source');
          if (source) {
            source.setData(data);
            console.log("[BOUNDARY_DEBUG] Boundary source update skipped: no data change");
          }
        }
      });
    }
  }, [layers?.ward]);

  // ── Render ───────────────────────────────────────────────────
  if (Platform.OS !== 'web') {
    // For mobile, fall back to existing NativeMap from StationMapCanvas
    const StationMapCanvas = require('./StationMapCanvas').default;
    return (
      <StationMapCanvas
        fields={fields}
        selectedFieldId={selectedFieldId}
        activeTool={activeTool}
        drawState={drawState}
        editState={editState}
        layers={layers}
        center={center}
        zoom={zoom}
        onFieldSelect={onFieldSelect}
        onMapClick={onMapClick}
        onMapMove={onMapMove}
        onEditVertexDrag={onEditVertexDrag}
      />
    );
  }

  const cursorStyle = activeTool === 'draw' ? 'crosshair' : activeTool === 'edit' ? 'grab' : 'grab';

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

/**
 * Helper to add all sources and layers after a style change.
 */
function addAllSourcesAndLayers(map, layersState = {}, boundariesData = {}) {
  // Re-add administrative boundaries first so they reside underneath field layers
  addBoundarySourcesAndLayers(map, layersState, boundariesData);

  // Re-add fields source
  if (!map.getSource('fields-source')) {
    map.addSource('fields-source', {
      type: 'geojson',
      data: emptyFeatureCollection(),
    });
  }

  // Re-add layers if not present
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

  // Re-add draw source and layers
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
      paint: { 'line-color': '#2196F3', 'line-width': 2, 'line-dasharray': [6, 4], 'line-opacity': 0.8 },
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

  // Re-add edit source and layers
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
      },
      filter: ['==', ['get', 'type'], 'edit-vertex'],
    });
  }

  // Re-add highlight layers
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

  console.log("[BOUNDARY_DEBUG] sources and layers re-added after style change");
}

/**
 * Helper to add all administrative boundary sources and layers.
 */
function addBoundarySourcesAndLayers(map, layersState, boundariesData) {
  // Province
  if (!map.getSource('admin-province-source')) {
    console.log("[BOUNDARY_DEBUG] Adding source: admin-province-source");
    map.addSource('admin-province-source', {
      type: 'geojson',
      data: boundariesData.province || emptyFeatureCollection(),
    });
    console.log("[BOUNDARY_DEBUG] Source added: admin-province-source");
  } else {
    console.warn("[BOUNDARY_DEBUG] Source already exists: admin-province-source");
  }

  if (!map.getLayer('admin-province-line')) {
    console.log("[BOUNDARY_DEBUG] Adding layer: admin-province-line");
    map.addLayer({
      id: 'admin-province-line',
      type: 'line',
      source: 'admin-province-source',
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 2.5,
        'line-opacity': 0.8,
      },
      layout: {
        visibility: layersState.province !== false ? 'visible' : 'none',
      },
    });
    console.log("[BOUNDARY_DEBUG] Layer added: admin-province-line");
  } else {
    console.warn("[BOUNDARY_DEBUG] Layer already exists: admin-province-line");
  }

  if (!map.getLayer('admin-province-label')) {
    console.log("[BOUNDARY_DEBUG] Adding layer: admin-province-label");
    map.addLayer({
      id: 'admin-province-label',
      type: 'symbol',
      source: 'admin-province-source',
      minzoom: 5,
      layout: {
        'text-field': ['coalesce', ['get', 'ten_tinh'], ['get', 'name'], ''],
        'text-size': 13,
        'text-offset': [0, 0],
        'text-anchor': 'center',
        visibility: layersState.province !== false ? 'visible' : 'none',
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': '#000000',
        'text-halo-width': 1.5,
      },
    });
    console.log("[BOUNDARY_DEBUG] Layer added: admin-province-label");
  } else {
    console.warn("[BOUNDARY_DEBUG] Layer already exists: admin-province-label");
  }

  // District
  if (!map.getSource('admin-district-source')) {
    console.log("[BOUNDARY_DEBUG] Adding source: admin-district-source");
    map.addSource('admin-district-source', {
      type: 'geojson',
      data: boundariesData.district || emptyFeatureCollection(),
    });
    console.log("[BOUNDARY_DEBUG] Source added: admin-district-source");
  } else {
    console.warn("[BOUNDARY_DEBUG] Source already exists: admin-district-source");
  }

  if (!map.getLayer('admin-district-line')) {
    console.log("[BOUNDARY_DEBUG] Adding layer: admin-district-line");
    map.addLayer({
      id: 'admin-district-line',
      type: 'line',
      source: 'admin-district-source',
      minzoom: 7,
      paint: {
        'line-color': '#BDBDBD',
        'line-width': 1.5,
        'line-dasharray': [4, 3],
        'line-opacity': 0.7,
      },
      layout: {
        visibility: layersState.district === true ? 'visible' : 'none',
      },
    });
    console.log("[BOUNDARY_DEBUG] Layer added: admin-district-line");
  } else {
    console.warn("[BOUNDARY_DEBUG] Layer already exists: admin-district-line");
  }

  if (!map.getLayer('admin-district-label')) {
    console.log("[BOUNDARY_DEBUG] Adding layer: admin-district-label");
    map.addLayer({
      id: 'admin-district-label',
      type: 'symbol',
      source: 'admin-district-source',
      minzoom: 8,
      layout: {
        'text-field': ['coalesce', ['get', 'ten_quan'], ['get', 'name'], ''],
        'text-size': 11,
        'text-offset': [0, 0],
        'text-anchor': 'center',
        visibility: layersState.district === true ? 'visible' : 'none',
      },
      paint: {
        'text-color': '#E0E0E0',
        'text-halo-color': '#000000',
        'text-halo-width': 1.2,
      },
    });
    console.log("[BOUNDARY_DEBUG] Layer added: admin-district-label");
  } else {
    console.warn("[BOUNDARY_DEBUG] Layer already exists: admin-district-label");
  }

  // Ward
  if (!map.getSource('admin-ward-source')) {
    console.log("[BOUNDARY_DEBUG] Adding source: admin-ward-source");
    map.addSource('admin-ward-source', {
      type: 'geojson',
      data: boundariesData.ward || emptyFeatureCollection(),
    });
    console.log("[BOUNDARY_DEBUG] Source added: admin-ward-source");
  } else {
    console.warn("[BOUNDARY_DEBUG] Source already exists: admin-ward-source");
  }

  if (!map.getLayer('admin-ward-line')) {
    console.log("[BOUNDARY_DEBUG] Adding layer: admin-ward-line");
    map.addLayer({
      id: 'admin-ward-line',
      type: 'line',
      source: 'admin-ward-source',
      minzoom: 10,
      paint: {
        'line-color': '#9E9E9E',
        'line-width': 1.0,
        'line-opacity': 0.6,
      },
      layout: {
        visibility: layersState.ward === true ? 'visible' : 'none',
      },
    });
    console.log("[BOUNDARY_DEBUG] Layer added: admin-ward-line");
  } else {
    console.warn("[BOUNDARY_DEBUG] Layer already exists: admin-ward-line");
  }

  if (!map.getLayer('admin-ward-label')) {
    console.log("[BOUNDARY_DEBUG] Adding layer: admin-ward-label");
    map.addLayer({
      id: 'admin-ward-label',
      type: 'symbol',
      source: 'admin-ward-source',
      minzoom: 11,
      layout: {
        'text-field': ['coalesce', ['get', 'ten_xa'], ['get', 'name'], ''],
        'text-size': 10,
        'text-offset': [0, 0],
        'text-anchor': 'center',
        visibility: layersState.ward === true ? 'visible' : 'none',
      },
      paint: {
        'text-color': '#CCCCCC',
        'text-halo-color': '#000000',
        'text-halo-width': 1.0,
      },
    });
    console.log("[BOUNDARY_DEBUG] Layer added: admin-ward-label");
  } else {
    console.warn("[BOUNDARY_DEBUG] Layer already exists: admin-ward-label");
  }
}