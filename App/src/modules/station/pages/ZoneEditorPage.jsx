/**
 * ZoneEditorPage — Management Zone Editor (Station/Admin)
 *
 * Uses raw HTML divs for all layout containers to ensure proper
 * CSS dimension propagation to MapLibre GL canvas.
 * React Native components only for interactive elements (buttons, text).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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

// ── Raster tile style — exact same as working StationMapCanvasMapLibre ──
function buildRasterStyle(baseMap) {
  const urls = {
    osm: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
  };
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [urls[baseMap] || urls.satellite],
        tileSize: 256,
        maxzoom: 19,
        attribution: '&copy; Esri',
      },
    },
    layers: [
      { id: 'raster-layer', type: 'raster', source: 'raster-tiles', minzoom: 3, maxzoom: 19 },
    ],
  };
}

const ZONE_COLORS = [
  '#1976D2', '#4CAF50', '#FF9800', '#9C27B0',
  '#F44336', '#00BCD4', '#795548', '#607D8B',
  '#E91E63', '#3F51B5', '#009688', '#FFC107',
];

function getZoneColor(index) {
  return ZONE_COLORS[index % ZONE_COLORS.length];
}



// ════════════════════════════════════════════════════════════════
// INLINE STYLES — all in JS for maximum control
// ════════════════════════════════════════════════════════════════
const OWNER_REQUIRED_MESSAGE = 'Field must be assigned to an owner before publishing.';
const FIELD_OWNER_DEBUG = process.env.EXPO_PUBLIC_FIELD_OWNER_DEBUG === '1';

function getFieldOwnerUserId(field) {
  return field?.owner_user_id || field?.ownerUserId || null;
}

function getFieldOwnerEmail(field) {
  return field?.owner_email || field?.ownerEmail || field?.owner_email_snapshot || null;
}

function formatErrorMessage(err, fallback = 'Failed') {
  if (!err) return fallback;
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    const messages = err.errors
      .map((entry) => (typeof entry === 'string' ? entry : entry?.message))
      .filter(Boolean);
    if (messages.length > 0) return messages.join(', ');
  }
  return err.message || fallback;
}

const S = {
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #E0E0E0',
    zIndex: 100,
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  ownerPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '6px 8px',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    border: '1px solid #E0E0E0',
    minWidth: 260,
  },
  ownerStatusRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ownerLabel: { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  ownerBadge: (hasOwner) => ({
    padding: '2px 6px',
    borderRadius: 8,
    backgroundColor: hasOwner ? '#E8F5E9' : '#FFEBEE',
    color: hasOwner ? '#2E7D32' : '#C62828',
    fontSize: 11,
    fontWeight: '700',
  }),
  ownerControls: { display: 'flex', alignItems: 'center', gap: 6 },
  ownerInput: {
    flex: 1,
    minWidth: 0,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #D5DDE5',
    color: '#1a1a1a',
    fontSize: 12,
    backgroundColor: '#fff',
  },
  ownerAssignBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    backgroundColor: '#1976D2',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  ownerFeedback: (type) => ({
    color: type === 'success' ? '#2E7D32' : '#C62828',
    fontSize: 11,
    lineHeight: '15px',
  }),
  headerTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '700', margin: 0 },
  headerMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  backBtn: { padding: '6px 12px', borderRadius: 6, backgroundColor: '#F5F5F5', border: 'none', cursor: 'pointer', color: '#1976D2', fontSize: 13, fontWeight: '600' },
  validateBtn: { padding: '6px 12px', borderRadius: 6, backgroundColor: '#F5F5F5', border: 'none', cursor: 'pointer', color: '#1976D2', fontSize: 12, fontWeight: '600' },
  publishBtn: { padding: '6px 14px', borderRadius: 6, backgroundColor: '#1976D2', border: 'none', cursor: 'pointer', color: '#ffffff', fontSize: 12, fontWeight: '700' },
  workspace: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 0,
  },
  leftPanel: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottom: '1px solid #F0F0F0',
  },
  panelTitle: { color: '#1a1a1a', fontSize: 14, fontWeight: '700', margin: 0 },
  addZoneBtn: { padding: '4px 10px', borderRadius: 6, backgroundColor: '#1976D2', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: '600' },
  zoneList: { flex: 1, overflowY: 'auto', overflowX: 'hidden' },
  zoneItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #F5F5F5',
    cursor: 'pointer',
  },
  zoneItemSelected: { backgroundColor: '#E3F2FD' },
  zoneColorDot: (color) => ({ width: 12, height: 12, borderRadius: 6, marginRight: 10, backgroundColor: color, flexShrink: 0 }),
  zoneItemInfo: { flex: 1, minWidth: 0 },
  zoneItemCode: { color: '#1a1a1a', fontSize: 14, fontWeight: '700', margin: 0 },
  zoneItemName: { color: '#888', fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  zoneItemArea: { color: '#999', fontSize: 10, marginTop: 2 },
  zoneStatusDot: (color) => ({ width: 8, height: 8, borderRadius: 4, backgroundColor: color, flexShrink: 0 }),
  // THE MAP AREA — this is the critical container
  mapShell: {
    flex: 1,
    position: 'relative',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  rightPanel: {
    width: 280,
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  bottomBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #E0E0E0',
    gap: 8,
    flexShrink: 0,
  },
  statusItem: { color: '#888', fontSize: 11, margin: 0 },
  statusDivider: { color: '#E0E0E0', fontSize: 11 },
  emptyState: { padding: 24, textAlign: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  emptyAction: { display: 'inline-block', padding: '8px 16px', borderRadius: 8, backgroundColor: '#1976D2', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: '600' },
  validationSummary: { padding: 12, borderTop: '1px solid #F0F0F0' },
  validationText: (isValid) => ({ fontSize: 12, color: isValid ? '#4CAF50' : '#F44336', margin: 0 }),
  warningText: { color: '#FF9800', fontSize: 11, marginTop: 2, margin: 0 },
  floatingToolbar: {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    gap: 4,
    zIndex: 10,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  toolBtn: (isActive) => ({
    width: 36,
    height: 36,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isActive ? '#E3F2FD' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
  }),
  floatingActions: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 12,
    zIndex: 10,
  },
  cancelAction: { padding: '10px 16px', borderRadius: 8, backgroundColor: '#ffffff', border: 'none', cursor: 'pointer', color: '#666', fontSize: 13, fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' },
  finishAction: { padding: '10px 20px', borderRadius: 8, backgroundColor: '#4CAF50', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' },
  drawHint: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '8px 16px',
    borderRadius: 8,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    whiteSpace: 'nowrap',
  },
  drawHintText: { color: '#1976D2', fontSize: 12, fontWeight: '600', margin: 0 },
  noSelection: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24 },
  noSelectionIcon: { fontSize: 32, marginBottom: 12 },
  noSelectionText: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  detailBody: { flex: 1, padding: 12, overflowY: 'auto' },
  detailField: { marginBottom: 14 },
  detailLabel: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailInput: { backgroundColor: '#F8F9FA', borderRadius: 6, padding: '8px 10px', color: '#1a1a1a', fontSize: 13, border: '1px solid #E0E0E0', width: '100%', boxSizing: 'border-box' },
  detailValue: { color: '#1a1a1a', fontSize: 13, margin: 0 },
  statusBadge: (isPublished) => ({ display: 'inline-block', padding: '4px 8px', borderRadius: 6, backgroundColor: isPublished ? '#E8F5E9' : '#FFF3E0' }),
  statusBadgeText: { color: '#333', fontSize: 12, margin: 0 },
  saveMetaBtn: { padding: '10px', borderRadius: 8, backgroundColor: '#1976D2', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: '600', width: '100%', marginBottom: 16 },
  actionBtn: { padding: '10px', borderRadius: 8, backgroundColor: '#F8F9FA', border: '1px solid #E0E0E0', cursor: 'pointer', color: '#1976D2', fontSize: 12, fontWeight: '600', width: '100%', marginBottom: 8 },
  deleteBtn: { padding: '10px', borderRadius: 8, backgroundColor: '#FFEBEE', border: 'none', cursor: 'pointer', color: '#C62828', fontSize: 12, fontWeight: '600', width: '100%' },
  toast: (type) => ({
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    borderRadius: 8,
    zIndex: 1000,
    backgroundColor: type === 'error' ? '#FFEBEE' : type === 'success' ? '#E8F5E9' : '#E3F2FD',
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
  }),
  unsavedBadge: { display: 'inline-block', padding: '3px 8px', borderRadius: 10, backgroundColor: '#FFF3E0', color: '#E65100', fontSize: 11, fontWeight: '600' },
  publishedBadge: { display: 'inline-block', padding: '3px 8px', borderRadius: 10, backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 11, fontWeight: '600' },
  loadingContainer: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
};

export default function ZoneEditorPage({ fieldId, onBack }) {
  const {
    zones, parentField, isLoading, hasUnsavedChanges, validationResult,
    fetchZones, createZone, updateZone, deleteZone, validateZones, assignFieldOwner, publishZones, getNextZoneCode,
  } = useZoneEditor(fieldId);

  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [activeTool, setActiveTool] = useState('pan');
  const [drawVertices, setDrawVertices] = useState([]);
  const [editVertices, setEditVertices] = useState([]);
  const [toast, setToast] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [ownerEmailInput, setOwnerEmailInput] = useState('');
  const [ownerFeedback, setOwnerFeedback] = useState(null);
  const [isAssigningOwner, setIsAssigningOwner] = useState(false);
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneCode, setEditZoneCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const isMountedRef = useRef(false);
  const fitBoundsDoneRef = useRef(false);

  const selectedZone = useMemo(() => zones.find((z) => String(z.id) === String(selectedZoneId)), [zones, selectedZoneId]);
  const fieldCoords = useMemo(() => extractPolygonCoords(parentField?.boundary), [parentField?.boundary]);
  const fieldArea = useMemo(() => parentField?.area ? parseFloat(parentField.area) : calculateAreaHectares(fieldCoords), [parentField?.area, fieldCoords]);
  const totalZoneArea = useMemo(() => zones.reduce((sum, z) => sum + (z.area ? parseFloat(z.area) : 0), 0), [zones]);
  const coverage = fieldArea > 0 ? ((totalZoneArea / fieldArea) * 100).toFixed(0) : '0';
  const ownerUserId = useMemo(() => getFieldOwnerUserId(parentField), [parentField]);
  const ownerEmail = useMemo(() => getFieldOwnerEmail(parentField), [parentField]);
  const hasOwner = !!ownerUserId;

  const showToastMsg = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (fieldId) fetchZones();
  }, [fieldId]);

  useEffect(() => {
    if (!parentField || !FIELD_OWNER_DEBUG) return;
    console.debug('[FieldOwnerDebug] selected field state', {
      fieldId: parentField.id || fieldId,
      ownerUserId,
      ownerEmail,
    });
  }, [fieldId, parentField?.id, ownerUserId, ownerEmail]);

  useEffect(() => {
    if (selectedZone) {
      setEditZoneName(selectedZone.name || '');
      setEditZoneCode(selectedZone.code || '');
    }
  }, [selectedZoneId]);

  useEffect(() => {
    // Inject style overrides into document.head once on mount to avoid JSX sibling diff issues
    const styleId = 'zone-editor-map-style-override';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        [data-zone-editor-map] {
          width: 100% !important;
          height: 100% !important;
        }
        [data-zone-editor-map] .maplibregl-canvas-container {
          width: 100% !important;
          height: 100% !important;
        }
        [data-zone-editor-map] .maplibregl-canvas {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const style = document.getElementById(styleId);
      if (style) style.remove();
    };
  }, []);

  // ════════════════════════════════════════════════════════════
  // MAP INIT — using raw DOM, same pattern as working map
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    console.log('[ZoneMap] init, container:', rect.width, 'x', rect.height);

    if (rect.width < 50 || rect.height < 50) {
      console.warn('[ZoneMap] container too small, deferring');
      requestAnimationFrame(() => { isMountedRef.current = false; });
      return;
    }

    const map = new maplibregl.Map({
      container: el,
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
        console.error('[ZoneMap] error:', e.error?.message);
      }
    });

    map.on('load', () => {
      console.log('[ZoneMap] loaded', {
        sources: Object.keys(map.getStyle()?.sources || {}),
        canvas: { w: map.getCanvas()?.width, h: map.getCanvas()?.height },
      });

      setMapLoaded(true);

      // GeoJSON sources
      map.addSource('parent-field', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'dim-overlay', type: 'fill', source: 'parent-field', paint: { 'fill-color': '#000000', 'fill-opacity': 0.2 } });
      map.addLayer({ id: 'parent-outline', type: 'line', source: 'parent-field', paint: { 'line-color': '#1976D2', 'line-width': 3, 'line-opacity': 0.9 } });

      map.addSource('zones-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'zone-fill', type: 'fill', source: 'zones-source', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 } });
      map.addLayer({ id: 'zone-border', type: 'line', source: 'zones-source', paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': 0.9 } });
      map.addLayer({ id: 'zone-highlight', type: 'fill', source: 'zones-source', paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.0 }, filter: ['==', 'id', ''] });
      map.addLayer({ id: 'zone-highlight-border', type: 'line', source: 'zones-source', paint: { 'line-color': '#ffffff', 'line-width': 4, 'line-opacity': 0.0 }, filter: ['==', 'id', ''] });
      map.addLayer({ id: 'zone-labels', type: 'symbol', source: 'zones-source', layout: { 'text-field': ['get', 'code'], 'text-size': 14, 'text-anchor': 'center', 'text-font': ['Arial Unicode MS Bold'], 'text-allow-overlap': true }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#333', 'text-halo-width': 1.5 } });

      map.addSource('draw-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'draw-fill', type: 'fill', source: 'draw-source', paint: { 'fill-color': '#1976D2', 'fill-opacity': 0.2 }, filter: ['==', ['get', 'type'], 'draw-polygon'] });
      map.addLayer({ id: 'draw-line', type: 'line', source: 'draw-source', paint: { 'line-color': '#1976D2', 'line-width': 2, 'line-dasharray': [6, 4] }, filter: ['==', ['get', 'type'], 'draw-line'] });
      map.addLayer({ id: 'draw-vertex', type: 'circle', source: 'draw-source', paint: { 'circle-radius': ['case', ['get', 'isFirst'], 7, 5], 'circle-color': ['case', ['get', 'isFirst'], '#4CAF50', '#1976D2'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 }, filter: ['==', ['get', 'type'], 'draw-vertex'] });

      map.addSource('edit-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'edit-fill', type: 'fill', source: 'edit-source', paint: { 'fill-color': '#FF9800', 'fill-opacity': 0.2 }, filter: ['==', ['get', 'type'], 'edit-polygon'] });
      map.addLayer({ id: 'edit-border', type: 'line', source: 'edit-source', paint: { 'line-color': '#FF9800', 'line-width': 2 }, filter: ['==', ['get', 'type'], 'edit-polygon'] });
      map.addLayer({ id: 'edit-vertex', type: 'circle', source: 'edit-source', paint: { 'circle-radius': 7, 'circle-color': '#FF9800', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 }, filter: ['==', ['get', 'type'], 'edit-vertex'] });

      // Force resize after layout settles
      setTimeout(() => {
        const currentMap = mapRef.current;
        if (!currentMap) return;
        currentMap.resize();
        const c = currentMap.getCanvas();
        const container = containerRef.current;
        if (c && container) {
          console.log('[ZoneMap] resize check:', {
            cw: c.clientWidth,
            ch: c.clientHeight,
            containerW: container.clientWidth,
            containerH: container.clientHeight,
            loaded: currentMap.loaded()
          });
        }
      }, 300);
    });

    map.on('click', (e) => {
      if (activeToolRef.current === 'draw') {
        drawVertexRef.current = [...drawVertexRef.current, [e.lngLat.lat, e.lngLat.lng]];
        setDrawVertices([...drawVertexRef.current]);
        return;
      }
      const features = map.queryRenderedFeatures(e.point, { layers: ['zone-fill'] });
      if (features.length > 0) { setSelectedZoneId(String(features[0].properties?.id)); return; }
      setSelectedZoneId(null);
    });

    let isDragging = false, dragIndex = -1;
    map.on('mousedown', 'edit-vertex', (e) => {
      if (activeToolRef.current !== 'edit') return;
      e.preventDefault(); isDragging = true; dragIndex = e.features?.[0]?.properties?.index ?? -1; map.dragPan.disable();
    });
    map.on('mouseup', (e) => {
      if (isDragging && dragIndex >= 0) {
        const nv = [...editVertexRef.current];
        if (dragIndex < nv.length) { nv[dragIndex] = [e.lngLat.lat, e.lngLat.lng]; editVertexRef.current = nv; setEditVertices([...nv]); }
      }
      isDragging = false; dragIndex = -1; map.dragPan.enable();
    });

    mapRef.current = map;

    const observer = new ResizeObserver(() => { if (mapRef.current) mapRef.current.resize(); });
    observer.observe(el);

    return () => {
      console.log('[ZoneMap] cleanup called, mapRef:', !!mapRef.current);
      observer.disconnect();
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; isMountedRef.current = false; }
    };
  }, []);

  const activeToolRef = useRef(activeTool);
  const drawVertexRef = useRef(drawVertices);
  const editVertexRef = useRef(editVertices);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { drawVertexRef.current = drawVertices; }, [drawVertices]);
  useEffect(() => { editVertexRef.current = editVertices; }, [editVertices]);

  // ── Boundary + fitBounds ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !parentField?.boundary) return;
    const boundary = typeof parentField.boundary === 'string' ? JSON.parse(parentField.boundary) : parentField.boundary;
    const src = map.getSource('parent-field');
    if (src) src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: boundary, properties: {} }] });

    if (fieldCoords.length > 0 && !fitBoundsDoneRef.current) {
      const bounds = calculateBounds(fieldCoords);
      if (bounds) {
        const [[s, w], [n, e]] = bounds;
        if (isFinite(s) && isFinite(w) && isFinite(n) && isFinite(e) && s < n && w < e) {
          const c = containerRef.current;
          if (c) {
            const r = c.getBoundingClientRect();
            const pad = Math.max(10, Math.min(60, Math.floor(Math.min(r.width, r.height) * 0.1)));
            fitBoundsDoneRef.current = true;
            try { map.fitBounds(new maplibregl.LngLatBounds([w, s], [e, n]), { padding: pad, maxZoom: 17, duration: 600 }); } catch (err) { console.warn('[ZoneMap] fitBounds err:', err.message); }
          }
        }
      }
    }
  }, [parentField?.boundary, fieldCoords, mapLoaded]);

  // ── Zone polygons ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const features = zones.map((z, i) => ({ type: 'Feature', geometry: typeof z.boundary === 'string' ? JSON.parse(z.boundary) : z.boundary, properties: { id: String(z.id), code: z.code || '', color: getZoneColor(i) } }));
    const src = map.getSource('zones-source');
    if (src) src.setData({ type: 'FeatureCollection', features });
  }, [zones, mapLoaded]);

  // ── Highlight ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const fv = selectedZoneId || '';
    if (map.getLayer('zone-highlight')) { map.setFilter('zone-highlight', ['==', 'id', fv]); map.setPaintProperty('zone-highlight', 'fill-opacity', selectedZoneId ? 0.15 : 0); }
    if (map.getLayer('zone-highlight-border')) { map.setFilter('zone-highlight-border', ['==', 'id', fv]); map.setPaintProperty('zone-highlight-border', 'line-opacity', selectedZoneId ? 1 : 0); map.setPaintProperty('zone-highlight-border', 'line-width', selectedZoneId ? 4 : 0); }
  }, [selectedZoneId, mapLoaded]);

  // ── Draw preview ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const f = [];
    const v = drawVertices;
    for (let i = 0; i < v.length; i++) f.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [v[i][1], v[i][0]] }, properties: { type: 'draw-vertex', isFirst: i === 0 ? 1 : 0, index: i } });
    if (v.length >= 2) { const lc = v.map(([a, o]) => [o, a]); if (v.length >= 3) lc.push(lc[0]); f.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: lc }, properties: { type: v.length >= 3 ? 'draw-polygon' : 'draw-line' } }); }
    if (v.length >= 3) { const pc = v.map(([a, o]) => [o, a]); pc.push(pc[0]); f.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [pc] }, properties: { type: 'draw-polygon' } }); }
    const src = map.getSource('draw-source');
    if (src) src.setData({ type: 'FeatureCollection', features: f });
    map.getCanvas().style.cursor = activeTool === 'draw' ? 'crosshair' : 'grab';
  }, [drawVertices, activeTool, mapLoaded]);

  // ── Edit preview ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (activeTool !== 'edit' || editVertices.length < 3) { const src = map.getSource('edit-source'); if (src) src.setData({ type: 'FeatureCollection', features: [] }); return; }
    const f = [];
    for (let i = 0; i < editVertices.length; i++) f.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [editVertices[i][1], editVertices[i][0]] }, properties: { type: 'edit-vertex', index: i } });
    const pc = editVertices.map(([a, o]) => [o, a]); pc.push(pc[0]); f.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [pc] }, properties: { type: 'edit-polygon' } });
    const src = map.getSource('edit-source');
    if (src) src.setData({ type: 'FeatureCollection', features: f });
  }, [editVertices, activeTool, mapLoaded]);

  // ── Actions ──
  const handleDrawZone = useCallback(async () => {
    if (drawVertices.length < 3) { showToastMsg('Need at least 3 vertices', 'error'); return; }
    try {
      setIsSaving(true);
      const code = getNextZoneCode();
      await createZone({ boundary: toGeoJsonPolygon(drawVertices), code, name: `Zone ${code}` });
      setDrawVertices([]); setActiveTool('pan');
      showToastMsg(`Zone ${code} created`, 'success');
    } catch (err) { showToastMsg(err.message || 'Failed', 'error'); } finally { setIsSaving(false); }
  }, [drawVertices, createZone, getNextZoneCode, showToastMsg]);

  const handleSaveEditZone = useCallback(async () => {
    if (!selectedZone || editVertices.length < 3) return;
    try { setIsSaving(true); await updateZone(selectedZone.id, { boundary: toGeoJsonPolygon(editVertices) }); setEditVertices([]); setActiveTool('pan'); showToastMsg('Zone updated', 'success'); } catch (err) { showToastMsg(err.message || 'Failed', 'error'); } finally { setIsSaving(false); }
  }, [selectedZone, editVertices, updateZone, showToastMsg]);

  const handleDeleteZone = useCallback(async () => {
    if (!selectedZone) return;
    try { await deleteZone(selectedZone.id); setSelectedZoneId(null); showToastMsg(`Zone ${selectedZone.code} deleted`, 'success'); } catch (err) { showToastMsg('Failed', 'error'); }
  }, [selectedZone, deleteZone, showToastMsg]);

  const handleSaveMeta = useCallback(async () => {
    if (!selectedZone) return;
    try { await updateZone(selectedZone.id, { code: editZoneCode || undefined, name: editZoneName || undefined }); showToastMsg('Saved', 'success'); } catch (err) { showToastMsg(err.message || 'Failed', 'error'); }
  }, [selectedZone, editZoneCode, editZoneName, updateZone, showToastMsg]);

  const handleAssignOwner = useCallback(async () => {
    const email = ownerEmailInput.trim();
    if (!email) {
      const message = 'Enter a registered user email.';
      setOwnerFeedback({ type: 'error', message });
      showToastMsg(message, 'error');
      return;
    }

    setIsAssigningOwner(true);
    setOwnerFeedback(null);
    try {
      const updatedField = await assignFieldOwner(email);
      const assignedEmail = getFieldOwnerEmail(updatedField) || email;
      const message = `Owner assigned: ${assignedEmail}`;
      setOwnerEmailInput('');
      setOwnerFeedback({ type: 'success', message });
      showToastMsg(message, 'success');
    } catch (err) {
      const message = formatErrorMessage(err, 'Failed to assign owner.');
      setOwnerFeedback({ type: 'error', message });
      showToastMsg(message, 'error');
    } finally {
      setIsAssigningOwner(false);
    }
  }, [ownerEmailInput, assignFieldOwner, showToastMsg]);

  const handleValidate = useCallback(async () => {
    try { const r = await validateZones(); showToastMsg(r.valid ? 'All zones valid' : `${r.errors?.length || 0} error(s)`, r.valid ? 'success' : 'error'); } catch (err) { showToastMsg('Validation failed', 'error'); }
  }, [validateZones, showToastMsg]);

  const handleOpenPublishModal = useCallback(() => {
    if (!hasOwner) {
      setOwnerFeedback({ type: 'error', message: OWNER_REQUIRED_MESSAGE });
      showToastMsg(OWNER_REQUIRED_MESSAGE, 'error');
      return;
    }
    setShowPublishModal(true);
  }, [hasOwner, showToastMsg]);

  const handlePublish = useCallback(async () => {
    setShowPublishModal(false);
    try {
      await publishZones();
      showToastMsg('Published!', 'success');
    } catch (err) {
      const message = formatErrorMessage(err, 'Failed');
      if (Array.isArray(err?.errors) && err.errors.some((entry) => entry?.type === 'NO_OWNER')) {
        setOwnerFeedback({ type: 'error', message });
      }
      showToastMsg(message, 'error');
    }
  }, [publishZones, showToastMsg]);

  const handleZoomToZone = useCallback((zone) => {
    const map = mapRef.current; if (!map) return;
    const b = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
    const c = b.type === 'Polygon' ? b.coordinates[0] : b.coordinates[0]?.[0];
    if (!c?.length) return;
    let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
    for (const [lng, lat] of c) { if (lng < mnX) mnX = lng; if (lng > mxX) mxX = lng; if (lat < mnY) mnY = lat; if (lat > mxY) mxY = lat; }
    try { map.fitBounds(new maplibregl.LngLatBounds([mnX, mnY], [mxX, mxY]), { padding: 60, maxZoom: 18, duration: 500 }); } catch (e) {}
  }, []);

  const handleFitToField = useCallback(() => {
    const map = mapRef.current; if (!map || !fieldCoords.length) return;
    const b = calculateBounds(fieldCoords); if (!b) return;
    const [[s, w], [n, e]] = b;
    const c = containerRef.current;
    const r = c?.getBoundingClientRect();
    const pad = r ? Math.min(60, Math.floor(Math.min(r.width, r.height) * 0.1)) : 40;
    try { map.fitBounds(new maplibregl.LngLatBounds([w, s], [e, n]), { padding: pad, maxZoom: 17, duration: 500 }); } catch (e2) {}
  }, [fieldCoords]);

  const handleStartEdit = useCallback(() => {
    if (!selectedZone) return;
    const b = typeof selectedZone.boundary === 'string' ? JSON.parse(selectedZone.boundary) : selectedZone.boundary;
    const c = (b.type === 'Polygon' ? b.coordinates[0] : b.coordinates[0][0]).map(([lng, lat]) => [lat, lng]);
    if (c.length > 1 && c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1]) c.pop();
    setEditVertices(c); setActiveTool('edit');
  }, [selectedZone]);

  // ═══ RENDER ═══
  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button style={S.backBtn} onClick={onBack}>← Back</button>
          <div>
            <div style={S.headerTitle}>🗺️ Management Zone Editor</div>
            <div style={S.headerMeta}>Field: {parentField?.name || '—'} | Code: {parentField?.code || '—'} | Area: {formatArea(fieldArea)}</div>
          </div>
        </div>
        <div style={S.headerRight}>
          <div style={S.ownerPanel}>
            <div style={S.ownerStatusRow}>
              <span style={S.ownerLabel}>Field Owner</span>
              <span style={S.ownerBadge(hasOwner)}>{hasOwner ? (ownerEmail || 'Assigned') : 'Unassigned'}</span>
            </div>
            <div style={S.ownerControls}>
              <input
                style={S.ownerInput}
                value={ownerEmailInput}
                onChange={(e) => setOwnerEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isAssigningOwner) handleAssignOwner(); }}
                placeholder={hasOwner ? 'Reassign by registered email' : 'owner@gmail.com'}
                aria-label="Registered owner email"
              />
              <button
                style={{ ...S.ownerAssignBtn, ...(isAssigningOwner ? S.disabledBtn : {}) }}
                onClick={handleAssignOwner}
                disabled={isAssigningOwner}
              >
                {isAssigningOwner ? 'Assigning...' : 'Assign'}
              </button>
            </div>
            {ownerFeedback && <div style={S.ownerFeedback(ownerFeedback.type)}>{ownerFeedback.message}</div>}
          </div>
          {hasUnsavedChanges && <span style={S.unsavedBadge}>● Unsaved</span>}
          {parentField?.zones_published_at && <span style={S.publishedBadge}>✓ Published</span>}
          <button style={S.validateBtn} onClick={handleValidate}>✓ Validate</button>
          <button style={S.publishBtn} onClick={handleOpenPublishModal}>🚀 Publish</button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div style={S.workspace}>
        {/* LEFT PANEL */}
        <div style={S.leftPanel}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>Zones ({zones.length})</span>
            <button style={S.addZoneBtn} onClick={() => { setSelectedZoneId(null); setActiveTool('draw'); }}>+ Add Zone</button>
          </div>
          <div style={S.zoneList}>
            {zones.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>📐</div>
                <div style={S.emptyTitle}>No zones configured</div>
                <div style={S.emptyDesc}>Draw internal zones inside this field to prepare it for monitoring.</div>
                <button style={S.emptyAction} onClick={() => setActiveTool('draw')}>Draw First Zone</button>
              </div>
            ) : zones.map((zone, idx) => {
              const isSel = String(zone.id) === String(selectedZoneId);
              const color = getZoneColor(idx);
              return (
                <div key={zone.id} style={{ ...S.zoneItem, ...(isSel ? S.zoneItemSelected : {}) }} onClick={() => { setSelectedZoneId(String(zone.id)); handleZoomToZone(zone); }}>
                  <div style={S.zoneColorDot(color)} />
                  <div style={S.zoneItemInfo}>
                    <div style={S.zoneItemCode}>{zone.code || '—'}</div>
                    <div style={S.zoneItemName}>{zone.name || ''}</div>
                    <div style={S.zoneItemArea}>{formatArea(zone.area ? parseFloat(zone.area) : 0)}</div>
                  </div>
                  <div style={S.zoneStatusDot(zone.zone_status === 'published' ? '#4CAF50' : '#FF9800')} />
                </div>
              );
            })}
          </div>
          {validationResult && (
            <div style={S.validationSummary}>
              <div style={S.validationText(validationResult.valid)}>{validationResult.valid ? '✓ All zones valid' : `✗ ${validationResult.errors?.length || 0} error(s)`}</div>
              {validationResult.warnings?.length > 0 && <div style={S.warningText}>⚠ {validationResult.warnings.length} warning(s)</div>}
            </div>
          )}
        </div>

        {/* MAP */}
        <div style={S.mapShell} key="zone-map-shell">
          <ZoneMapCanvas containerRef={containerRef} key="zone-map-canvas" />

          {/* Toolbar */}
          <div style={S.floatingToolbar} key="zone-floating-toolbar">
            <button style={S.toolBtn(activeTool === 'pan')} onClick={() => setActiveTool('pan')}>🖐️</button>
            <button style={S.toolBtn(activeTool === 'draw')} onClick={() => setActiveTool('draw')}>✏️</button>
            {selectedZone && <button style={S.toolBtn(activeTool === 'edit')} onClick={handleStartEdit}>🔧</button>}
            <button style={S.toolBtn(false)} onClick={handleFitToField}>📐</button>
            {activeTool === 'draw' && drawVertices.length > 0 && <button style={S.toolBtn(false)} onClick={() => setDrawVertices(p => p.slice(0, -1))}>↩️</button>}
          </div>

          {activeTool === 'draw' && drawVertices.length >= 3 && (
            <div style={S.floatingActions} key="zone-floating-draw-actions">
              <button style={S.cancelAction} onClick={() => { setDrawVertices([]); setActiveTool('pan'); }}>Cancel</button>
              <button style={S.finishAction} onClick={handleDrawZone} disabled={isSaving}>{isSaving ? 'Saving...' : `✓ Create Zone (${drawVertices.length} pts)`}</button>
            </div>
          )}
          {activeTool === 'edit' && editVertices.length >= 3 && (
            <div style={S.floatingActions} key="zone-floating-edit-actions">
              <button style={S.cancelAction} onClick={() => { setEditVertices([]); setActiveTool('pan'); }}>Cancel</button>
              <button style={S.finishAction} onClick={handleSaveEditZone} disabled={isSaving}>{isSaving ? 'Saving...' : '✓ Save Changes'}</button>
            </div>
          )}
          {activeTool === 'draw' && (
            <div style={S.drawHint} key="zone-draw-hint">
              <div style={S.drawHintText}>
                {drawVertices.length === 0 ? 'Click on the map to draw zone vertices' : drawVertices.length < 3 ? `Click ${3 - drawVertices.length} more point(s)` : 'Click "Create Zone" or add more points'}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={S.rightPanel}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>{selectedZone ? `Zone ${selectedZone.code || '—'}` : 'Zone Details'}</span>
          </div>
          {selectedZone ? (
            <div style={S.detailBody}>
              <div style={S.detailField}>
                <div style={S.detailLabel}>Code</div>
                <input style={S.detailInput} value={editZoneCode} onChange={(e) => setEditZoneCode(e.target.value)} placeholder="Zone code" />
              </div>
              <div style={S.detailField}>
                <div style={S.detailLabel}>Name</div>
                <input style={S.detailInput} value={editZoneName} onChange={(e) => setEditZoneName(e.target.value)} placeholder="Zone name" />
              </div>
              <div style={S.detailField}>
                <div style={S.detailLabel}>Area</div>
                <div style={S.detailValue}>{formatArea(selectedZone.area ? parseFloat(selectedZone.area) : 0)}</div>
              </div>
              <div style={S.detailField}>
                <div style={S.detailLabel}>Status</div>
                <span style={S.statusBadge(selectedZone.zone_status === 'published')}>
                  <span style={S.statusBadgeText}>{selectedZone.zone_status === 'published' ? '🟢 Published' : '🟡 Draft'}</span>
                </span>
              </div>
              <button style={S.saveMetaBtn} onClick={handleSaveMeta}>💾 Save Details</button>
              <button style={S.actionBtn} onClick={() => handleZoomToZone(selectedZone)}>🔍 Zoom to Zone</button>
              <button style={S.actionBtn} onClick={handleStartEdit}>🔧 Edit Geometry</button>
              <button style={S.deleteBtn} onClick={handleDeleteZone}>🗑️ Delete Zone</button>
            </div>
          ) : (
            <div style={S.noSelection}>
              <div style={S.noSelectionIcon}>👆</div>
              <div style={S.noSelectionText}>Select a zone from the list or click on the map</div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={S.bottomBar}>
        <span style={S.statusItem}>Zones: {zones.length}</span>
        <span style={S.statusDivider}>|</span>
        <span style={S.statusItem}>Total zone area: {formatArea(totalZoneArea)}</span>
        <span style={S.statusDivider}>|</span>
        <span style={S.statusItem}>Parent field area: {formatArea(fieldArea)}</span>
        <span style={S.statusDivider}>|</span>
        <span style={S.statusItem}>Coverage: {coverage}%</span>
        {validationResult && (<><span style={S.statusDivider}>|</span><span style={{ ...S.statusItem, color: validationResult.valid ? '#4CAF50' : '#F44336' }}>Validation: {validationResult.valid ? '✓ Valid' : `✗ ${validationResult.errors?.length || 0} error(s)`}</span></>)}
      </div>

      {/* TOAST */}
      {toast && <div style={S.toast(toast.type)}>{toast.message}</div>}

      {/* PUBLISH MODAL */}
      {showPublishModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 400, maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <div style={{ color: '#1a1a1a', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>🚀 Publish Management Zones?</div>
            <div style={{ color: '#666', fontSize: 13, lineHeight: '20px', marginBottom: 20 }}>
              This will make the current zone map available for the assigned field owner.
              {'\n\n'}Owner: {ownerEmail || ownerUserId}
              {'\n\n'}You can still edit and republish later.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#F5F5F5', border: 'none', cursor: 'pointer', color: '#666', fontSize: 13, fontWeight: '600' }} onClick={() => setShowPublishModal(false)}>Cancel</button>
              <button style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#1976D2', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: '700' }} onClick={handlePublish}>Publish</button>
            </div>
          </div>
        </div>
      )}

      {/* HTML LOADER OVERLAY — floats over the main layout instead of destroying the DOM tree */}
      {isLoading && !parentField && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(248, 249, 250, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={{ ...S.loadingText, marginTop: 12 }}>Loading field details...</Text>
        </div>
      )}

    </div>
  );
}

const ZoneMapCanvas = React.memo(({ containerRef }) => {
  console.log('[ZoneMapCanvas] Rendered');
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}
      data-zone-editor-map
    />
  );
});
