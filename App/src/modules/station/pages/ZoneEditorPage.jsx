/**
 * ZoneEditorPage — Management Zone Editor (Station/Admin)
 *
 * A focused GIS workspace for dividing a parent field boundary
 * into smaller internal management zones.
 *
 * Theme: Matches existing CropVision Admin light UI.
 * Map: MapLibre GL with safe fitBounds and proper container sizing.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useZoneEditor from '../hooks/useZoneEditor';
import {
  extractPolygonCoords,
  calculateBounds,
  calculateAreaHectares,
  formatArea,
  toGeoJsonPolygon,
} from '../utils/fieldGeometry';

// ── Raster tile style (same as working Field Management map) ──
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
        tiles: [urls[baseMap] || urls.satellite],
        tileSize: 256,
        maxzoom: 19,
        attribution: attributions[baseMap] || attributions.satellite,
      },
    },
    layers: [
      { id: 'raster-layer', type: 'raster', source: 'raster-tiles', minzoom: 3, maxzoom: 19 },
    ],
  };
}

// ── Zone colors ───────────────────────────────────────────────
const ZONE_COLORS = [
  '#1976D2', '#4CAF50', '#FF9800', '#9C27B0',
  '#F44336', '#00BCD4', '#795548', '#607D8B',
  '#E91E63', '#3F51B5', '#009688', '#FFC107',
];

function getZoneColor(index) {
  return ZONE_COLORS[index % ZONE_COLORS.length];
}

export default function ZoneEditorPage({ fieldId, onBack }) {
  // ── Hooks ──
  const {
    zones,
    parentField,
    isLoading,
    hasUnsavedChanges,
    validationResult,
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
    validateZones,
    publishZones,
    getNextZoneCode,
  } = useZoneEditor(fieldId);

  // ── Local State ──
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [activeTool, setActiveTool] = useState('pan');
  const [drawVertices, setDrawVertices] = useState([]);
  const [editVertices, setEditVertices] = useState([]);
  const [toast, setToast] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneCode, setEditZoneCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Refs
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const isMountedRef = useRef(false);
  const fitBoundsDoneRef = useRef(false);

  // Derived
  const selectedZone = useMemo(
    () => zones.find((z) => String(z.id) === String(selectedZoneId)),
    [zones, selectedZoneId]
  );

  const fieldCoords = useMemo(() => {
    if (!parentField?.boundary) return [];
    return extractPolygonCoords(parentField.boundary);
  }, [parentField?.boundary]);

  const fieldArea = useMemo(() => {
    if (!parentField?.area && fieldCoords.length === 0) return 0;
    if (parentField?.area) return parseFloat(parentField.area);
    return calculateAreaHectares(fieldCoords);
  }, [parentField?.area, fieldCoords]);

  const totalZoneArea = useMemo(
    () => zones.reduce((sum, z) => sum + (z.area ? parseFloat(z.area) : 0), 0),
    [zones]
  );

  const coverage = fieldArea > 0 ? ((totalZoneArea / fieldArea) * 100).toFixed(0) : '0';

  // ── Toast ──
  const showToastMsg = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Load zones on mount ──
  useEffect(() => {
    if (fieldId) {
      fetchZones().then(({ field }) => {
        if (!field) {
          showToastMsg('Failed to load field data', 'error');
        }
      });
    }
  }, [fieldId]);

  // ── Sync edit fields when selected zone changes ──
  useEffect(() => {
    if (selectedZone) {
      setEditZoneName(selectedZone.name || '');
      setEditZoneCode(selectedZone.code || '');
    }
  }, [selectedZoneId]);

  // ════════════════════════════════════════════════════════════
  // MAP INITIALIZATION (mount once)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    // Verify container has dimensions before creating map
    const rect = containerRef.current.getBoundingClientRect();
    console.log('[ZoneMap] container dimensions:', rect.width, 'x', rect.height);

    if (rect.width < 10 || rect.height < 10) {
      console.warn('[ZoneMap] container too small, deferring initialization');
      // Retry after a frame
      requestAnimationFrame(() => {
        isMountedRef.current = false;
      });
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildRasterStyle('satellite'),
      center: [106.6297, 10.8231],
      zoom: 14,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: true,
      fadeDuration: 0,
      trackResize: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('error', (e) => {
      if (!e.error?.message?.includes('fetch') && !e.error?.message?.includes('tile')) {
        console.warn('[ZoneMap] error:', e.error?.message || e.error);
      }
    });

    map.on('load', () => {
      console.log('[ZoneMap] style loaded');
      setMapLoaded(true);

      // ── Parent field boundary ──
      map.addSource('parent-field', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Dim overlay
      map.addLayer({
        id: 'dim-overlay',
        type: 'fill',
        source: 'parent-field',
        paint: { 'fill-color': '#000000', 'fill-opacity': 0.2 },
      });

      // Parent outline
      map.addLayer({
        id: 'parent-outline',
        type: 'line',
        source: 'parent-field',
        paint: { 'line-color': '#1976D2', 'line-width': 3, 'line-opacity': 0.9 },
      });

      // ── Zone polygons ──
      map.addSource('zones-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zones-source',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 },
      });

      map.addLayer({
        id: 'zone-border',
        type: 'line',
        source: 'zones-source',
        paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': 0.9 },
      });

      // Selected zone highlight
      map.addLayer({
        id: 'zone-highlight',
        type: 'fill',
        source: 'zones-source',
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.0 },
        filter: ['==', 'id', ''],
      });

      map.addLayer({
        id: 'zone-highlight-border',
        type: 'line',
        source: 'zones-source',
        paint: { 'line-color': '#ffffff', 'line-width': 4, 'line-opacity': 0.0 },
        filter: ['==', 'id', ''],
      });

      // Zone labels
      map.addLayer({
        id: 'zone-labels',
        type: 'symbol',
        source: 'zones-source',
        layout: {
          'text-field': ['get', 'code'],
          'text-size': 14,
          'text-anchor': 'center',
          'text-font': ['Arial Unicode MS Bold'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#333333',
          'text-halo-width': 1.5,
        },
      });

      // ── Draw layers ──
      map.addSource('draw-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'draw-fill',
        type: 'fill',
        source: 'draw-source',
        paint: { 'fill-color': '#1976D2', 'fill-opacity': 0.2 },
        filter: ['==', ['get', 'type'], 'draw-polygon'],
      });

      map.addLayer({
        id: 'draw-line',
        type: 'line',
        source: 'draw-source',
        paint: { 'line-color': '#1976D2', 'line-width': 2, 'line-dasharray': [6, 4] },
        filter: ['==', ['get', 'type'], 'draw-line'],
      });

      map.addLayer({
        id: 'draw-vertex',
        type: 'circle',
        source: 'draw-source',
        paint: {
          'circle-radius': ['case', ['get', 'isFirst'], 7, 5],
          'circle-color': ['case', ['get', 'isFirst'], '#4CAF50', '#1976D2'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
        filter: ['==', ['get', 'type'], 'draw-vertex'],
      });

      // ── Edit layers ──
      map.addSource('edit-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'edit-fill',
        type: 'fill',
        source: 'edit-source',
        paint: { 'fill-color': '#FF9800', 'fill-opacity': 0.2 },
        filter: ['==', ['get', 'type'], 'edit-polygon'],
      });

      map.addLayer({
        id: 'edit-border',
        type: 'line',
        source: 'edit-source',
        paint: { 'line-color': '#FF9800', 'line-width': 2 },
        filter: ['==', ['get', 'type'], 'edit-polygon'],
      });

      map.addLayer({
        id: 'edit-vertex',
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

      // Force resize after all layers are added
      setTimeout(() => {
        if (map) map.resize();
      }, 100);
    });

    // ── Click handler ──
    map.on('click', (e) => {
      const tool = activeToolRef.current;

      if (tool === 'draw') {
        const { lng, lat } = e.lngLat;
        drawVertexRef.current = [...drawVertexRef.current, [lat, lng]];
        setDrawVertices([...drawVertexRef.current]);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: ['zone-fill'] });
      if (features.length > 0) {
        const clickedId = features[0].properties?.id;
        if (clickedId) {
          setSelectedZoneId(String(clickedId));
          return;
        }
      }
      setSelectedZoneId(null);
    });

    // ── Edit vertex drag ──
    let isDragging = false;
    let dragIndex = -1;

    map.on('mousedown', 'edit-vertex', (e) => {
      if (activeToolRef.current !== 'edit') return;
      e.preventDefault();
      isDragging = true;
      dragIndex = e.features?.[0]?.properties?.index ?? -1;
      map.dragPan.disable();
    });

    map.on('mouseup', (e) => {
      if (isDragging && dragIndex >= 0) {
        const { lng, lat } = e.lngLat;
        const newVertices = [...editVertexRef.current];
        if (dragIndex < newVertices.length) {
          newVertices[dragIndex] = [lat, lng];
          editVertexRef.current = newVertices;
          setEditVertices([...newVertices]);
        }
      }
      isDragging = false;
      dragIndex = -1;
      map.dragPan.enable();
    });

    mapRef.current = map;

    // ── ResizeObserver ──
    const observer = new ResizeObserver(() => {
      if (containerRef.current && mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isMountedRef.current = false;
      }
    };
  }, []);

  // Refs for mount-once handlers
  const activeToolRef = useRef(activeTool);
  const drawVertexRef = useRef(drawVertices);
  const editVertexRef = useRef(editVertices);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { drawVertexRef.current = drawVertices; }, [drawVertices]);
  useEffect(() => { editVertexRef.current = editVertices; }, [editVertices]);

  // ── Update parent field boundary + fitBounds (SAFE) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !parentField?.boundary) return;

    const boundary =
      typeof parentField.boundary === 'string'
        ? JSON.parse(parentField.boundary)
        : parentField.boundary;

    const source = map.getSource('parent-field');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: boundary, properties: {} }],
      });
    }

    // Safe fitBounds
    if (fieldCoords.length > 0 && !fitBoundsDoneRef.current) {
      const bounds = calculateBounds(fieldCoords);
      if (bounds) {
        const [[south, west], [north, east]] = bounds;

        // Validate bounds
        if (
          isFinite(south) && isFinite(west) && isFinite(north) && isFinite(east) &&
          south >= -90 && south <= 90 && north >= -90 && north <= 90 &&
          west >= -180 && west <= 180 && east >= -180 && east <= 180 &&
          south < north && west < east
        ) {
          // Get container dimensions for safe padding
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const maxPad = Math.min(60, Math.floor(Math.min(rect.width, rect.height) * 0.1));
            const safePadding = Math.max(10, maxPad);

            fitBoundsDoneRef.current = true;

            try {
              map.fitBounds(
                new maplibregl.LngLatBounds([west, south], [east, north]),
                {
                  padding: { top: safePadding, bottom: safePadding, left: safePadding, right: safePadding },
                  maxZoom: 17,
                  duration: 600,
                }
              );
            } catch (err) {
              console.warn('[ZoneMap] fitBounds failed:', err.message);
            }
          }
        } else {
          console.warn('[ZoneMap] invalid bounds:', { south, west, north, east });
        }
      }
    }
  }, [parentField?.boundary, fieldCoords, mapLoaded]);

  // ── Update zone polygons ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const features = zones.map((zone, idx) => {
      const boundary =
        typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
      return {
        type: 'Feature',
        geometry: boundary,
        properties: {
          id: String(zone.id),
          code: zone.code || '',
          name: zone.name || '',
          color: getZoneColor(idx),
        },
      };
    });

    const source = map.getSource('zones-source');
    if (source) source.setData({ type: 'FeatureCollection', features });
  }, [zones, mapLoaded]);

  // ── Selected zone highlight ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const filterVal = selectedZoneId || '';
    if (map.getLayer('zone-highlight')) {
      map.setFilter('zone-highlight', ['==', 'id', filterVal]);
      map.setPaintProperty('zone-highlight', 'fill-opacity', selectedZoneId ? 0.15 : 0.0);
    }
    if (map.getLayer('zone-highlight-border')) {
      map.setFilter('zone-highlight-border', ['==', 'id', filterVal]);
      map.setPaintProperty('zone-highlight-border', 'line-opacity', selectedZoneId ? 1.0 : 0.0);
      map.setPaintProperty('zone-highlight-border', 'line-width', selectedZoneId ? 4 : 0);
    }
  }, [selectedZoneId, mapLoaded]);

  // ── Draw preview ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const features = [];
    const vertices = drawVertices;

    for (let i = 0; i < vertices.length; i++) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [vertices[i][1], vertices[i][0]] },
        properties: { type: 'draw-vertex', isFirst: i === 0 ? 1 : 0, index: i },
      });
    }

    if (vertices.length >= 2) {
      const lineCoords = vertices.map(([lat, lng]) => [lng, lat]);
      if (vertices.length >= 3) lineCoords.push(lineCoords[0]);
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: lineCoords },
        properties: { type: vertices.length >= 3 ? 'draw-polygon' : 'draw-line' },
      });
    }

    if (vertices.length >= 3) {
      const polyCoords = vertices.map(([lat, lng]) => [lng, lat]);
      polyCoords.push(polyCoords[0]);
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [polyCoords] },
        properties: { type: 'draw-polygon' },
      });
    }

    const source = map.getSource('draw-source');
    if (source) source.setData({ type: 'FeatureCollection', features });

    map.getCanvas().style.cursor = activeTool === 'draw' ? 'crosshair' : 'grab';
  }, [drawVertices, activeTool, mapLoaded]);

  // ── Edit preview ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (activeTool !== 'edit' || editVertices.length < 3) {
      const source = map.getSource('edit-source');
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const features = [];
    for (let i = 0; i < editVertices.length; i++) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [editVertices[i][1], editVertices[i][0]] },
        properties: { type: 'edit-vertex', index: i },
      });
    }

    const polyCoords = editVertices.map(([lat, lng]) => [lng, lat]);
    polyCoords.push(polyCoords[0]);
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [polyCoords] },
      properties: { type: 'edit-polygon' },
    });

    const source = map.getSource('edit-source');
    if (source) source.setData({ type: 'FeatureCollection', features });
  }, [editVertices, activeTool, mapLoaded]);

  // ── Actions ──
  const handleDrawZone = useCallback(async () => {
    if (drawVertices.length < 3) {
      showToastMsg('Need at least 3 vertices', 'error');
      return;
    }
    try {
      setIsSaving(true);
      const boundary = toGeoJsonPolygon(drawVertices);
      const code = getNextZoneCode();
      await createZone({ boundary, code, name: `Zone ${code}` });
      setDrawVertices([]);
      setActiveTool('pan');
      showToastMsg(`Zone ${code} created`, 'success');
    } catch (err) {
      showToastMsg(err.message || 'Failed to create zone', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [drawVertices, createZone, getNextZoneCode, showToastMsg]);

  const handleSaveEditZone = useCallback(async () => {
    if (!selectedZone || editVertices.length < 3) return;
    try {
      setIsSaving(true);
      const boundary = toGeoJsonPolygon(editVertices);
      await updateZone(selectedZone.id, { boundary });
      setEditVertices([]);
      setActiveTool('pan');
      showToastMsg('Zone updated', 'success');
    } catch (err) {
      showToastMsg(err.message || 'Failed to update zone', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedZone, editVertices, updateZone, showToastMsg]);

  const handleDeleteZone = useCallback(async () => {
    if (!selectedZone) return;
    try {
      await deleteZone(selectedZone.id);
      setSelectedZoneId(null);
      showToastMsg(`Zone ${selectedZone.code} deleted`, 'success');
    } catch (err) {
      showToastMsg('Failed to delete zone', 'error');
    }
  }, [selectedZone, deleteZone, showToastMsg]);

  const handleSaveZoneMetadata = useCallback(async () => {
    if (!selectedZone) return;
    try {
      await updateZone(selectedZone.id, {
        code: editZoneCode || undefined,
        name: editZoneName || undefined,
      });
      showToastMsg('Zone details saved', 'success');
    } catch (err) {
      showToastMsg(err.message || 'Failed to save', 'error');
    }
  }, [selectedZone, editZoneCode, editZoneName, updateZone, showToastMsg]);

  const handleValidate = useCallback(async () => {
    try {
      const result = await validateZones();
      if (result.valid) {
        showToastMsg('All zones valid', 'success');
      } else {
        const errCount = result.errors?.length || 0;
        const warnCount = result.warnings?.length || 0;
        showToastMsg(`${errCount} error(s), ${warnCount} warning(s)`, errCount > 0 ? 'error' : 'info');
      }
    } catch (err) {
      showToastMsg('Validation failed', 'error');
    }
  }, [validateZones, showToastMsg]);

  const handlePublish = useCallback(async () => {
    setShowPublishModal(false);
    try {
      await publishZones();
      showToastMsg('Zones published successfully', 'success');
    } catch (err) {
      const errors = err.errors || [err.message || 'Publish failed'];
      showToastMsg(errors.join(', '), 'error');
    }
  }, [publishZones, showToastMsg]);

  const handleZoomToZone = useCallback((zone) => {
    const map = mapRef.current;
    if (!map) return;
    const boundary = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
    const coords = boundary.type === 'Polygon' ? boundary.coordinates[0] : boundary.coordinates[0]?.[0];
    if (!coords || coords.length === 0) return;

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    try {
      map.fitBounds(
        new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat]),
        { padding: 60, maxZoom: 18, duration: 500 }
      );
    } catch (err) {
      console.warn('[ZoneMap] zoom to zone failed:', err.message);
    }
  }, []);

  const handleFitToField = useCallback(() => {
    const map = mapRef.current;
    if (!map || fieldCoords.length === 0) return;
    const bounds = calculateBounds(fieldCoords);
    if (bounds) {
      const [[south, west], [north, east]] = bounds;
      try {
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const maxPad = rect ? Math.min(60, Math.floor(Math.min(rect.width, rect.height) * 0.1)) : 40;
        map.fitBounds(
          new maplibregl.LngLatBounds([west, south], [east, north]),
          { padding: maxPad, maxZoom: 17, duration: 500 }
        );
      } catch (err) {
        console.warn('[ZoneMap] fit to field failed:', err.message);
      }
    }
  }, [fieldCoords]);

  const handleStartEdit = useCallback(() => {
    if (!selectedZone) return;
    const boundary = typeof selectedZone.boundary === 'string'
      ? JSON.parse(selectedZone.boundary) : selectedZone.boundary;
    const coords = (boundary.type === 'Polygon' ? boundary.coordinates[0] : boundary.coordinates[0][0])
      .map(([lng, lat]) => [lat, lng]);
    if (coords.length > 1) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) coords.pop();
    }
    setEditVertices(coords);
    setActiveTool('edit');
  }, [selectedZone]);

  const handleUndoDraw = useCallback(() => setDrawVertices((prev) => prev.slice(0, -1)), []);
  const handleCancelDraw = useCallback(() => { setDrawVertices([]); setActiveTool('pan'); }, []);
  const handleCancelEdit = useCallback(() => { setEditVertices([]); setActiveTool('pan'); }, []);

  // ── Loading ──
  if (isLoading && !parentField) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading zone editor...</Text>
      </View>
    );
  }

  // ── Render ──
  return (
    <View style={styles.root}>
      {/* ═══ EDITOR HEADER ═══ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>🗺️ Management Zone Editor</Text>
            <Text style={styles.headerMeta}>
              Field: {parentField?.name || '—'} | Code: {parentField?.code || '—'} | Area: {formatArea(fieldArea)}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {hasUnsavedChanges && (
            <View style={styles.unsavedBadge}>
              <Text style={styles.unsavedText}>● Unsaved</Text>
            </View>
          )}
          {parentField?.zones_published_at && (
            <View style={styles.publishedBadge}>
              <Text style={styles.publishedText}>✓ Published</Text>
            </View>
          )}
          <TouchableOpacity style={styles.validateBtn} onPress={handleValidate}>
            <Text style={styles.validateBtnText}>✓ Validate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn} onPress={() => setShowPublishModal(true)}>
            <Text style={styles.publishBtnText}>🚀 Publish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ WORKSPACE ═══ */}
      <View style={styles.workspace}>
        {/* ── LEFT PANEL ── */}
        <View style={styles.leftPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Zones ({zones.length})</Text>
            <TouchableOpacity
              style={styles.addZoneBtn}
              onPress={() => { setSelectedZoneId(null); setActiveTool('draw'); }}
            >
              <Text style={styles.addZoneBtnText}>+ Add Zone</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.zoneList} showsVerticalScrollIndicator={false}>
            {zones.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📐</Text>
                <Text style={styles.emptyTitle}>No zones configured</Text>
                <Text style={styles.emptyDesc}>
                  Draw internal zones inside this field to prepare it for monitoring and future user-side interaction.
                </Text>
                <TouchableOpacity style={styles.emptyAction} onPress={() => setActiveTool('draw')}>
                  <Text style={styles.emptyActionText}>Draw First Zone</Text>
                </TouchableOpacity>
              </View>
            ) : (
              zones.map((zone, idx) => {
                const isSelected = String(zone.id) === String(selectedZoneId);
                const color = getZoneColor(idx);
                const area = zone.area ? parseFloat(zone.area) : 0;
                const statusColor = zone.zone_status === 'published' ? '#4CAF50' : '#FF9800';

                return (
                  <TouchableOpacity
                    key={zone.id}
                    style={[styles.zoneItem, isSelected && styles.zoneItemSelected]}
                    onPress={() => { setSelectedZoneId(String(zone.id)); handleZoomToZone(zone); }}
                  >
                    <View style={[styles.zoneColorDot, { backgroundColor: color }]} />
                    <View style={styles.zoneItemInfo}>
                      <Text style={styles.zoneItemCode}>{zone.code || '—'}</Text>
                      <Text style={styles.zoneItemName} numberOfLines={1}>{zone.name || ''}</Text>
                      <Text style={styles.zoneItemArea}>{formatArea(area)}</Text>
                    </View>
                    <View style={[styles.zoneStatusDot, { backgroundColor: statusColor }]} />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {validationResult && (
            <View style={styles.validationSummary}>
              <Text style={[styles.validationText, validationResult.valid ? styles.validText : styles.errorText]}>
                {validationResult.valid ? '✓ All zones valid' : `✗ ${validationResult.errors?.length || 0} error(s)`}
              </Text>
              {validationResult.warnings?.length > 0 && (
                <Text style={styles.warningText}>⚠ {validationResult.warnings.length} warning(s)</Text>
              )}
            </View>
          )}
        </View>

        {/* ── CENTER MAP ── */}
        {/* IMPORTANT: Use raw <div> (not <View>) to ensure MapLibre canvas receives proper dimensions.
            React Native Web's <View> does not propagate flex sizing to raw HTML <div> children. */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#E0E0E0',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
            }}
          />

          {/* Floating toolbar */}
          <View style={styles.floatingToolbar}>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'pan' && styles.toolBtnActive]}
              onPress={() => setActiveTool('pan')}
            >
              <Text style={styles.toolBtnText}>🖐️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'draw' && styles.toolBtnActive]}
              onPress={() => setActiveTool('draw')}
            >
              <Text style={styles.toolBtnText}>✏️</Text>
            </TouchableOpacity>
            {selectedZone && (
              <TouchableOpacity
                style={[styles.toolBtn, activeTool === 'edit' && styles.toolBtnActive]}
                onPress={handleStartEdit}
              >
                <Text style={styles.toolBtnText}>🔧</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.toolBtn} onPress={handleFitToField}>
              <Text style={styles.toolBtnText}>📐</Text>
            </TouchableOpacity>
            {activeTool === 'draw' && drawVertices.length > 0 && (
              <TouchableOpacity style={styles.toolBtn} onPress={handleUndoDraw}>
                <Text style={styles.toolBtnText}>↩️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Draw mode actions */}
          {activeTool === 'draw' && drawVertices.length >= 3 && (
            <View style={styles.floatingActions}>
              <TouchableOpacity style={styles.cancelAction} onPress={handleCancelDraw}>
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.finishAction, isSaving && styles.disabledBtn]} onPress={handleDrawZone}>
                <Text style={styles.finishActionText}>
                  {isSaving ? 'Saving...' : `✓ Create Zone (${drawVertices.length} pts)`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Edit mode actions */}
          {activeTool === 'edit' && editVertices.length >= 3 && (
            <View style={styles.floatingActions}>
              <TouchableOpacity style={styles.cancelAction} onPress={handleCancelEdit}>
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.finishAction, isSaving && styles.disabledBtn]} onPress={handleSaveEditZone}>
                <Text style={styles.finishActionText}>{isSaving ? 'Saving...' : '✓ Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Draw hint */}
          {activeTool === 'draw' && (
            <View style={styles.drawHint}>
              <Text style={styles.drawHintText}>
                {drawVertices.length === 0
                  ? 'Click on the map to draw zone vertices'
                  : drawVertices.length < 3
                    ? `Click ${3 - drawVertices.length} more point(s)`
                    : 'Click "Create Zone" or add more points'}
              </Text>
            </View>
          )}

          {/* Map error */}
          {mapError && (
            <View style={styles.mapErrorBanner}>
              <Text style={styles.mapErrorText}>⚠ {mapError}</Text>
            </View>
          )}
        </div>
          
        {/* ── RIGHT PANEL ── */}
        <View style={styles.rightPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              {selectedZone ? `Zone ${selectedZone.code || '—'}` : 'Zone Details'}
            </Text>
            {selectedZone && (
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedZoneId(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedZone ? (
            <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Code</Text>
                <TextInput
                  style={styles.detailInput}
                  value={editZoneCode}
                  onChangeText={setEditZoneCode}
                  placeholder="Zone code"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Name</Text>
                <TextInput
                  style={styles.detailInput}
                  value={editZoneName}
                  onChangeText={setEditZoneName}
                  placeholder="Zone name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Area</Text>
                <Text style={styles.detailValue}>
                  {formatArea(selectedZone.area ? parseFloat(selectedZone.area) : 0)}
                </Text>
              </View>

              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, selectedZone.zone_status === 'published' ? styles.statusPublished : styles.statusDraft]}>
                  <Text style={styles.statusBadgeText}>
                    {selectedZone.zone_status === 'published' ? '🟢 Published' : '🟡 Draft'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.saveMetaBtn} onPress={handleSaveZoneMetadata}>
                <Text style={styles.saveMetaBtnText}>💾 Save Details</Text>
              </TouchableOpacity>

              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleZoomToZone(selectedZone)}>
                  <Text style={styles.actionBtnText}>🔍 Zoom to Zone</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleStartEdit}>
                  <Text style={[styles.actionBtnText, { color: '#FF9800' }]}>🔧 Edit Geometry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteZone}>
                  <Text style={styles.deleteBtnText}>🗑️ Delete Zone</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
          <View style={styles.noSelection}>
              <Text style={styles.noSelectionIcon}>👆</Text>
              <Text style={styles.noSelectionText}>
                Select a zone from the list or click on the map
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ═══ BOTTOM STATUS BAR ═══ */}
      <View style={styles.bottomBar}>
        <Text style={styles.statusItem}>Zones: {zones.length}</Text>
        <Text style={styles.statusDivider}>|</Text>
        <Text style={styles.statusItem}>Total zone area: {formatArea(totalZoneArea)}</Text>
        <Text style={styles.statusDivider}>|</Text>
        <Text style={styles.statusItem}>Parent field area: {formatArea(fieldArea)}</Text>
        <Text style={styles.statusDivider}>|</Text>
        <Text style={styles.statusItem}>Coverage: {coverage}%</Text>
        {validationResult && (
          <>
            <Text style={styles.statusDivider}>|</Text>
            <Text style={[styles.statusItem, validationResult.valid ? styles.statusValid : styles.statusError]}>
              Validation: {validationResult.valid ? '✓ Valid' : `✗ ${validationResult.errors?.length || 0} error(s)`}
            </Text>
          </>
        )}
      </View>

      {/* ═══ TOAST ═══ */}
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : toast.type === 'success' ? styles.toastSuccess : styles.toastInfo]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* ═══ PUBLISH MODAL ═══ */}
      <Modal visible={showPublishModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚀 Publish Management Zones?</Text>
            <Text style={styles.modalDesc}>
              This will make the current zone map available for future user-side field interaction.{'\n\n'}You can still edit and republish later.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPublishModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handlePublish}>
                <Text style={styles.modalConfirmText}>Publish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES — Matches CropVision Admin light theme
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  backBtnText: { color: '#1976D2', fontSize: 13, fontWeight: '600' },
  headerTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '700' },
  headerMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  unsavedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#FFF3E0' },
  unsavedText: { color: '#E65100', fontSize: 11, fontWeight: '600' },
  publishedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#E8F5E9' },
  publishedText: { color: '#2E7D32', fontSize: 11, fontWeight: '600' },
  validateBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F5F5F5' },
  validateBtnText: { color: '#1976D2', fontSize: 12, fontWeight: '600' },
  publishBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1976D2' },
  publishBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  // Workspace
  workspace: { flex: 1, flexDirection: 'row', overflow: 'hidden' },

  // Left Panel
  leftPanel: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  panelTitle: { color: '#1a1a1a', fontSize: 14, fontWeight: '700' },
  addZoneBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#1976D2' },
  addZoneBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  zoneList: { flex: 1 },

  // Zone item
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  zoneItemSelected: { backgroundColor: '#E3F2FD' },
  zoneColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  zoneItemInfo: { flex: 1 },
  zoneItemCode: { color: '#1a1a1a', fontSize: 14, fontWeight: '700' },
  zoneItemName: { color: '#888', fontSize: 11, marginTop: 1 },
  zoneItemArea: { color: '#999', fontSize: 10, marginTop: 2 },
  zoneStatusDot: { width: 8, height: 8, borderRadius: 4 },

  // Empty state
  emptyState: { padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  emptyAction: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1976D2' },
  emptyActionText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Validation
  validationSummary: { padding: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  validationText: { fontSize: 12 },
  validText: { color: '#4CAF50' },
  errorText: { color: '#F44336' },
  warningText: { color: '#FF9800', fontSize: 11, marginTop: 2 },

  // Map
  mapContainer: { flex: 1, position: 'relative', backgroundColor: '#E0E0E0' },

  // Floating toolbar
  floatingToolbar: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    gap: 4,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toolBtnActive: { backgroundColor: '#E3F2FD' },
  toolBtnText: { fontSize: 16 },

  // Floating actions
  floatingActions: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  cancelAction: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelActionText: { color: '#666', fontSize: 13, fontWeight: '600' },
  finishAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  finishActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },

  // Draw hint
  drawHint: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  drawHintText: { color: '#1976D2', fontSize: 12, fontWeight: '600' },

  mapErrorBanner: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  mapErrorText: { color: '#C62828', fontSize: 12 },

  // Right Panel
  rightPanel: {
    width: 280,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#888', fontSize: 12 },
  detailBody: { flex: 1, padding: 12 },
  detailField: { marginBottom: 14 },
  detailLabel: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#1a1a1a',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailValue: { color: '#1a1a1a', fontSize: 13 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusPublished: { backgroundColor: '#E8F5E9' },
  statusDraft: { backgroundColor: '#FFF3E0' },
  statusBadgeText: { color: '#333', fontSize: 12 },
  saveMetaBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveMetaBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  detailActions: { gap: 8 },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionBtnText: { color: '#1976D2', fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#C62828', fontSize: 12, fontWeight: '600' },

  // No selection
  noSelection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noSelectionIcon: { fontSize: 32, marginBottom: 12 },
  noSelectionText: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  statusItem: { color: '#888', fontSize: 11 },
  statusDivider: { color: '#E0E0E0', fontSize: 11 },
  statusValid: { color: '#4CAF50' },
  statusError: { color: '#F44336' },

  // Toast
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  toastSuccess: { backgroundColor: '#E8F5E9' },
  toastError: { backgroundColor: '#FFEBEE' },
  toastInfo: { backgroundColor: '#E3F2FD' },
  toastText: { color: '#1a1a1a', fontSize: 13, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: 400,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: { color: '#1a1a1a', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalDesc: { color: '#666', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F5F5F5' },
  modalCancelText: { color: '#666', fontSize: 13, fontWeight: '600' },
  modalConfirm: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1976D2' },
  modalConfirmText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});