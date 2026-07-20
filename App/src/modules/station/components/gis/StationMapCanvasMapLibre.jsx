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
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
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
import {
  BOUNDARY_LAYER_CONFIG,
  loadBoundaryGeoJSON,
  emptyBoundaryCollection,
  rehydrateBoundarySourcesFromCache,
} from '../../utils/loadBoundaryGeoJSON';

// ── Tile style URLs ──────────────────────────────────────────
const TILE_STYLES = {
  osm: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  terrain: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

// Maximum supported zoom for OSM raster tiles
// OSM tiles are available up to z=19. Beyond that, tiles 404.
const MAP_MAX_ZOOM = 19;
const MAP_MIN_ZOOM = 3;

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
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [urls[baseMap] || urls.osm],
        tileSize: 256,
        maxzoom: MAP_MAX_ZOOM,
        attribution: attributions[baseMap] || attributions.osm,
      },
    },
    layers: [
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: MAP_MIN_ZOOM,
        maxzoom: MAP_MAX_ZOOM,
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
  adminLayers,
  center,
  zoom,
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
  const initialFitDoneRef = useRef(false);
  const pendingFieldsRef = useRef(null); // Stores fields that arrived before style loaded

  // Refs for values accessed in mount-once event handlers (avoid stale closures)
  const activeToolRef = useRef(activeTool);
  const onFieldSelectRef = useRef(onFieldSelect);
  const onFieldHoverRef = useRef(onFieldHover);
  const onMapClickRef = useRef(onMapClick);
  const onEditVertexDragRef = useRef(onEditVertexDrag);
  const adminLayersRef = useRef(adminLayers); // For style-reload callback

  // Keep refs in sync with props
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { onFieldSelectRef.current = onFieldSelect; }, [onFieldSelect]);
  useEffect(() => { onFieldHoverRef.current = onFieldHover; }, [onFieldHover]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onEditVertexDragRef.current = onEditVertexDrag; }, [onEditVertexDrag]);
  useEffect(() => { adminLayersRef.current = adminLayers; }, [adminLayers]);

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
    if (mapRef.current || !containerRef.current) return;

    // Prevent double-init in React StrictMode
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [center[1], center[0]], // MapLibre: [lng, lat]
      zoom: Math.min(zoom, MAP_MAX_ZOOM), // Clamp initial zoom
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: true,
      fadeDuration: 0, // Disable fade to prevent tile flickering
      trackResize: false, // We handle resize ourselves
    });


    // Suppress tile loading errors (CORS/network issues for edge tiles)
    map.on('error', (e) => {
      // Only log non-tile errors; tile errors are expected for edge cases
      if (e.error?.message?.includes('fetch') || e.error?.status === 0) {
        console.warn("[MAP] tile fetch error (non-critical)");
      } else {
        console.error("[MAP] error:", e.error?.message);
      }
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {

      // ══════════════════════════════════════════════════════════
      // ADMIN BOUNDARY LAYERS (added BEFORE field layers so fields
      // render ON TOP of administrative boundaries)
      // ══════════════════════════════════════════════════════════
      addAdminBoundarySources(map);
      addAdminBoundaryLayers(map);

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

      // Apply any fields that arrived before the map was ready
      if (pendingFieldsRef.current && pendingFieldsRef.current.length > 0) {
        const geojson = fieldsToFeatureCollection(pendingFieldsRef.current);
        const source = map.getSource('fields-source');
        if (source) {
          source.setData(geojson);
        }
      }


      // Trigger initial load of default-enabled boundary layers.
      // Province starts as true. We load it here because the adminLayers
      // useEffect runs before isStyleLoaded() is true on first mount.
      const defaultLayersToLoad = Object.entries(BOUNDARY_LAYER_CONFIG)
        .filter(([, cfg]) => cfg.defaultVisible)
        .map(([key]) => key);

      defaultLayersToLoad.forEach(async (layerKey) => {
        const cfg = BOUNDARY_LAYER_CONFIG[layerKey];
        try {
          const geojson = await loadBoundaryGeoJSON(layerKey);
          if (!geojson) {
            console.warn('[BOUNDARY_WARN] Boundary layer skipped due to load failure:', layerKey);
            return;
          }
          const src = map.getSource(cfg.sourceId);
          if (src && src.setData) {
            src.setData(geojson);
          }
          if (map.getLayer(cfg.lineLayerId)) {
            map.setLayoutProperty(cfg.lineLayerId, 'visibility', 'visible');
          }
          if (map.getLayer(cfg.labelLayerId)) {
            map.setLayoutProperty(cfg.labelLayerId, 'visibility', 'visible');
          }
        } catch (err) {
          console.error('[BOUNDARY_ERROR] Failed to load default boundary layer', { layerKey, errorMessage: err.message });
        }
      });
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

    map.on('moveend', () => {
      if (isProgrammaticMoveRef.current) {
        isProgrammaticMoveRef.current = false;
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
          if (width > 0 && height > 0 && mapRef.current) {
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
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Store fields for deferred application if style not loaded yet
    pendingFieldsRef.current = fields;

    if (!map.isStyleLoaded()) {
      return;
    }

    const geojson = fieldsToFeatureCollection(fields);


    const source = map.getSource('fields-source');
    if (source) {
      source.setData(geojson);
    } else {
      console.warn("[MAP_SOURCE] fields-source not found — source may not be initialized yet");
    }
  }, [fields]);

  // ── Update selected field highlight ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const filterVal = selectedFieldId || '';


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

    map.fitBounds(mapBounds, {
      padding: { top: 40, bottom: 40, left: 40, right: 40 },
      maxZoom: 16,
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

    // After style change, re-add all sources and layers, then rehydrate boundary caches
    map.once('styledata', () => {
      addAllSourcesAndLayers(map);
      rehydrateBoundarySourcesFromCache(map, adminLayersRef.current);

      // Restore field data that was lost when style changed
      if (pendingFieldsRef.current && pendingFieldsRef.current.length > 0) {
        const geojson = fieldsToFeatureCollection(pendingFieldsRef.current);
        const source = map.getSource('fields-source');
        if (source) {
          source.setData(geojson);
        }
      }
    });
  }, [layers?.baseMap]);

  // ════════════════════════════════════════════════════════════
  // Admin Boundary Layer: React to adminLayers visibility toggles
  // Each toggle either:
  //   a) Sets MapLibre layer visibility if data already loaded, OR
  //   b) Lazy-loads the GeoJSON first, then sets data + visibility
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!adminLayers) return;

    const syncBoundaryLayer = async (layerKey) => {
      const config = BOUNDARY_LAYER_CONFIG[layerKey];
      const visible = adminLayers[layerKey];
      const visibility = visible ? 'visible' : 'none';

      // Check if source already has data
      const source = map.getSource(config.sourceId);

      if (visible) {
        // Need to ensure data is loaded before showing
        const sourceHasData = source && source._data &&
          source._data !== 'undefined' &&
          typeof source._data === 'object' &&
          source._data.features &&
          source._data.features.length > 0;

        if (!sourceHasData) {
          const geojson = await loadBoundaryGeoJSON(layerKey);
          if (!geojson) {
            console.warn('[BOUNDARY_WARN] Boundary layer skipped due to load failure:', layerKey);
            return;
          }
          // Update source data
          const currentSource = map.getSource(config.sourceId);
          if (currentSource && currentSource.setData) {
            currentSource.setData(geojson);
          }
        }
      }

      // Update line layer visibility
      if (map.getLayer(config.lineLayerId)) {
        map.setLayoutProperty(config.lineLayerId, 'visibility', visibility);
      }

      // Update label layer visibility
      if (map.getLayer(config.labelLayerId)) {
        map.setLayoutProperty(config.labelLayerId, 'visibility', visibility);
      }
    };

    // Sync all boundary layers
    Object.keys(BOUNDARY_LAYER_CONFIG).forEach(layerKey => {
      syncBoundaryLayer(layerKey).catch(err => {
        console.error('[BOUNDARY_ERROR] Failed to sync boundary layer', { layerKey, errorMessage: err.message });
      });
    });

  }, [adminLayers]);

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
 * Add empty admin boundary sources to the map.
 * Sources start with empty FeatureCollection — data is lazy-loaded on demand.
 */
function addAdminBoundarySources(map) {
  Object.values(BOUNDARY_LAYER_CONFIG).forEach(config => {
    if (!map.getSource(config.sourceId)) {
      map.addSource(config.sourceId, {
        type: 'geojson',
        data: emptyBoundaryCollection(),
      });
    }
  });
}

/**
 * Add admin boundary line and label layers to the map.
 * All boundary layers start as 'none' (hidden) — visibility is controlled
 * by the adminLayers useEffect after data is loaded.
 */
function addAdminBoundaryLayers(map) {
  Object.values(BOUNDARY_LAYER_CONFIG).forEach(config => {
    // Line layer
    if (!map.getLayer(config.lineLayerId)) {
      map.addLayer({
        id: config.lineLayerId,
        type: 'line',
        source: config.sourceId,
        minzoom: config.minZoom,
        maxzoom: config.maxZoom,
        layout: {
          'visibility': 'none', // Hidden by default — data not loaded yet
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

    // Label layer
    if (!map.getLayer(config.labelLayerId)) {
      map.addLayer({
        id: config.labelLayerId,
        type: 'symbol',
        source: config.sourceId,
        minzoom: config.labelMinZoom,
        maxzoom: config.maxZoom,
        layout: {
          'visibility': 'none',
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

/**
 * Helper to add all sources and layers after a style change.
 */
function addAllSourcesAndLayers(map) {
  // Re-add admin boundary sources and layers FIRST (so field layers render on top)
  addAdminBoundarySources(map);
  addAdminBoundaryLayers(map);

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

}