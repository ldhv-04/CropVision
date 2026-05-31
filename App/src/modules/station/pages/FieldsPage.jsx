/**
 * FieldsPage — GIS-Based Field Management (SoilzePro Map View)
 *
 * Uses MapLibre GL (web) + react-native-maps (mobile).
 * MapLibre provides WebGL-rendered tiles + GeoJSON-based field polygons.
 *
 * Architecture:
 * - MapLibre map instance mounted once (no React re-render loops)
 * - GeoJSON sources updated imperatively
 * - Viewport: Map → Store only (no Store → Map → Store loops)
 * - ResizeObserver for stable tile rendering
 *
 * Features:
 * - Real map tiles with field polygon boundaries
 * - Polygon drawing, coordinate entry, center+radius creation
 * - Polygon vertex editing (drag/add/remove)
 * - Soft delete with trash recovery
 * - Layer controls, filter bar, field detail panel
 * - Zustand state management
 */

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';

// Store & Hooks
import useFieldGISStore from '../stores/fieldGISStore';
import useFieldCRUD from '../hooks/useFieldCRUD';

// GIS Components
import StationMapCanvasMapLibre from '../components/gis/StationMapCanvasMapLibre';
import MapToolbar from '../components/gis/MapToolbar';
import LayerControls from '../components/gis/LayerControls';
import FilterBar from '../components/gis/FilterBar';
import FieldDetailPanel from '../components/gis/FieldDetailPanel';
import CreateFieldDrawer from '../components/gis/CreateFieldDrawer';
import ConfirmationDialog from '../components/gis/ConfirmationDialog';
import FieldExplorerPanel from '../components/gis/explorer/FieldExplorerPanel';
import ZoneEditorPage from './ZoneEditorPage';
import { extractPolygonCoords, calculateAreaHectares } from '../utils/fieldGeometry';
import { FIELD_FOCUS_ZOOM, clampZoom } from '../config/mapConfig';

export default function FieldsPage() {
  // ── Store state ──────────────────────────────────────────────
  const {
    fields,
    selectedFieldId,
    hoveredFieldId,
    isLoading,
    error,
    center,
    zoom,
    activeTool,
    drawState,
    editState,
    filters,
    layers,
    adminLayers,
    panelState,
    toast,
    searchQuery,
    explorerCollapsed,
    // Actions
    setSelectedField,
    setHoveredField,
    clearSelection,
    setActiveTool,
    setViewport,
    setFilter,
    setLayer,
    toggleAdminLayer,
    setAdminLayerVisibility,
    openPanel,
    closePanel,
    setCreateMethod,
    startDrawing,
    addDrawVertex,
    undoDrawVertex,
    finishDrawing,
    cancelDrawing,
    startEditing,
    updateEditVertex,
    addEditVertex,
    removeEditVertex,
    undoEdit,
    cancelEditing,
    finishEditing,
    showToast,
    clearToast,
    addField,
    updateField,
    removeField,
    setSearchQuery,
    toggleExplorer,
  } = useFieldGISStore();

  const { fetchFields, createField, updateField: updateFieldAPI, deleteField } = useFieldCRUD();

  // ── Local state ──────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editMetadataField, setEditMetadataField] = useState(null);
  const [zoneEditorFieldId, setZoneEditorFieldId] = useState(null);

  // ── Map ref for imperative flyTo (bridge between explorer and map) ──
  const mapInstanceRef = useRef(null);

  const handleMapRef = useCallback((map) => {
    mapInstanceRef.current = map;
  }, []);

  // ── Explorer → Map: flyTo field on explorer click ────────────
  const handleExplorerFlyTo = useCallback(
    (centroid, zoomLevel) => {
      const map = mapInstanceRef.current;
      if (!map) {
        console.warn('[MapSync] flyTo — map not ready');
        return;
      }
      const safeZoom = clampZoom(zoomLevel || FIELD_FOCUS_ZOOM);
      console.log('[ZOOM_DEBUG] flyTo requested', {
        center: [centroid[1], centroid[0]],
        zoom: safeZoom,
        rawZoom: zoomLevel,
      });
      map.flyTo({
        center: [centroid[1], centroid[0]], // MapLibre: [lng, lat]
        zoom: safeZoom,
        duration: 800,
      });
    },
    []
  );

  // ── Map → Explorer: handle polygon click with map sync ──────
  const handleFieldSelectFromMap = useCallback(
    (id) => {
      if (drawState.isDrawing || editState.isEditing) return;
      console.log('[MapSync] polygon clicked:', id);
      setSelectedField(id);
      openPanel('detail');
    },
    [drawState.isDrawing, editState.isEditing, setSelectedField, openPanel]
  );

  // ── Map hover handler ───────────────────────────────────────
  const handleMapFieldHover = useCallback(
    (id) => {
      setHoveredField(id);
    },
    [setHoveredField]
  );

  // ── Load fields on mount ─────────────────────────────────────
  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // ── Keyboard shortcuts (web only) ────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('pan'); break;
        case 'd': setActiveTool('draw'); break;
        case 'escape':
          if (drawState.isDrawing) cancelDrawing();
          else if (editState.isEditing) cancelEditing();
          else closePanel();
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            if (drawState.isDrawing) undoDrawVertex();
            else if (editState.isEditing) undoEdit();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawState.isDrawing, editState.isEditing]);

  // ── Filtered fields ──────────────────────────────────────────
  const filteredFields = useMemo(() => {
    let result = fields;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q) || f.crop_type?.toLowerCase().includes(q));
    }
    if (filters.cropType) {
      result = result.filter((f) => f.crop_type === filters.cropType);
    }
    if (filters.status) {
      result = result.filter((f) => f.status === filters.status);
    }

    return result;
  }, [fields, filters]);

  // ── Selected field ───────────────────────────────────────────
  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId),
    [fields, selectedFieldId]
  );

  // ── Handlers ─────────────────────────────────────────────────

  // handleFieldSelect is now split:
  // - handleFieldSelectFromMap: for polygon clicks (Map → List sync)
  // - handleExplorerFlyTo: for list clicks (List → Map sync, handled in FieldExplorerPanel)

  const handleMapClick = useCallback(
    (latlng) => {
      if (activeTool === 'draw' && drawState.isDrawing) {
        addDrawVertex(latlng);
      }
    },
    [activeTool, drawState.isDrawing, addDrawVertex]
  );

  const handleMapMove = useCallback(
    (newCenter, newZoom) => {
      setViewport(newCenter, newZoom);
    },
    [setViewport]
  );

  const handleToolChange = useCallback(
    (tool) => {
      if (tool === 'draw') {
        startDrawing();
        openPanel('create', { createMethod: 'draw' });
      } else if (tool === 'edit' && selectedField) {
        const coords = extractPolygonCoords(selectedField.boundary);
        startEditing(selectedField.id, coords);
        openPanel('create', { createMethod: 'draw' });
      } else {
        setActiveTool(tool);
      }
    },
    [selectedField, startDrawing, startEditing, setActiveTool, openPanel]
  );

  const handleEditVertexDrag = useCallback(
    (index, latlng) => {
      updateEditVertex(index, latlng);
    },
    [updateEditVertex]
  );

  // ── Create Field ─────────────────────────────────────────────
  const handleStartCreate = useCallback(() => {
    startDrawing();
    openPanel('create', { createMethod: 'draw' });
  }, [startDrawing, openPanel]);

  const handleFinishDraw = useCallback(() => {
    finishDrawing();
  }, [finishDrawing]);

  const handleSaveField = useCallback(
    async (fieldData) => {
      setIsSaving(true);
      try {
        const newField = await createField(fieldData);
        closePanel();
        cancelDrawing();
        if (newField) {
          setSelectedField(newField.id);
        }
      } catch (err) {
        // Error handled by useFieldCRUD
      } finally {
        setIsSaving(false);
      }
    },
    [createField, closePanel, cancelDrawing, setSelectedField]
  );

  const handleCancelCreate = useCallback(() => {
    cancelDrawing();
    closePanel();
  }, [cancelDrawing, closePanel]);

  // ── Edit Boundary ────────────────────────────────────────────
  const handleStartEditBoundary = useCallback(() => {
    if (!selectedField) return;
    const coords = extractPolygonCoords(selectedField.boundary);
    startEditing(selectedField.id, coords);
  }, [selectedField, startEditing]);

  const handleSaveBoundary = useCallback(async () => {
    if (!editState.fieldId || editState.currentVertices.length < 3) return;
    setIsSaving(true);
    try {
      const { toGeoJsonPolygon } = require('../utils/fieldGeometry');
      const boundary = toGeoJsonPolygon(editState.currentVertices);
      await updateFieldAPI(editState.fieldId, { boundary });
      cancelEditing();
    } catch (err) {
      // Error handled
    } finally {
      setIsSaving(false);
    }
  }, [editState, updateFieldAPI, cancelEditing]);

  // ── Configure Zones ──────────────────────────────────────────
  const handleConfigureZones = useCallback(() => {
    if (!selectedField) return;
    setZoneEditorFieldId(selectedField.id);
    closePanel();
  }, [selectedField, closePanel]);

  const handleBackFromZoneEditor = useCallback(() => {
    setZoneEditorFieldId(null);
    // Refresh fields to pick up any zone changes
    fetchFields();
  }, [fetchFields]);

  // ── Edit Metadata (deprecated — replaced by Configure Zones) ─
  const handleEditMetadata = useCallback(() => {
    if (!selectedField) return;
    showToast('Use Configure Zones instead', 'info');
  }, [selectedField, showToast]);

  // ── Delete Field ─────────────────────────────────────────────
  const handleDeleteRequest = useCallback(() => {
    if (!selectedField) return;
    setDeleteTarget(selectedField);
  }, [selectedField]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteField(deleteTarget.id);
      setDeleteTarget(null);
      clearSelection();
    } catch (err) {
      // Error handled
    }
  }, [deleteTarget, deleteField, clearSelection]);

  // ── KPI calculations ─────────────────────────────────────────
  const totalFields = fields.length;
  const totalArea = useMemo(
    () => fields.reduce((sum, f) => {
      const coords = extractPolygonCoords(f.boundary);
      return sum + calculateAreaHectares(coords);
    }, 0),
    [fields]
  );
  const activeFields = useMemo(() => fields.filter((f) => f.status === 'ACTIVE' || !f.status).length, [fields]);

  // ── Loading state ────────────────────────────────────────────
  if (isLoading && fields.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading fields...</Text>
      </View>
    );
  }

  // ── If zone editor is active, render it full-screen ──────────
  if (zoneEditorFieldId) {
    return <ZoneEditorPage fieldId={zoneEditorFieldId} onBack={handleBackFromZoneEditor} />;
  }

  return (
    <View style={[styles.container, { overflow: 'hidden' }]}>
      {/* ═══ Header Bar ═══ */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>🌾 Field Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleStartCreate}>
            <Text style={styles.headerBtnText}>+ New Field</Text>
          </TouchableOpacity>
          {editState.isEditing && (
            <TouchableOpacity style={styles.saveBoundaryBtn} onPress={handleSaveBoundary}>
              <Text style={styles.saveBoundaryText}>💾 Save Boundary</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ═══ Explorer + Map ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        {/* Field Explorer Panel (collapsible sidebar) */}
        <FieldExplorerPanel
          fields={fields}
          selectedFieldId={selectedFieldId}
          hoveredFieldId={hoveredFieldId}
          searchQuery={searchQuery}
          explorerCollapsed={explorerCollapsed}
          filters={filters}
          setSelectedField={setSelectedField}
          setHoveredField={setHoveredField}
          setSearchQuery={setSearchQuery}
          toggleExplorer={toggleExplorer}
          setFilter={setFilter}
          onFlyToField={handleExplorerFlyTo}
        />

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Main Map */}
          <StationMapCanvasMapLibre
            fields={filteredFields}
            selectedFieldId={selectedFieldId}
            hoveredFieldId={hoveredFieldId}
            activeTool={activeTool}
            drawState={drawState}
            editState={editState}
            layers={layers}
            adminLayers={adminLayers}
            center={center}
            zoom={zoom}
            onFieldSelect={handleFieldSelectFromMap}
            onFieldHover={handleMapFieldHover}
            onMapClick={handleMapClick}
            onMapMove={handleMapMove}
            onEditVertexDrag={handleEditVertexDrag}
            onMapRef={handleMapRef}
          />

        {/* Floating Overlays */}
        <MapToolbar activeTool={activeTool} onToolChange={handleToolChange} />
        <LayerControls
          layers={layers}
          adminLayers={adminLayers}
          onLayerChange={setLayer}
          onAdminLayerToggle={toggleAdminLayer}
        />
        {/* <FilterBar
          filters={filters}
          onFilterChange={setFilter}
          fieldCount={filteredFields.length}
          totalCount={totalFields}
        /> */}

        {/* Draw Mode Actions (floating bottom) */}
        {activeTool === 'draw' && drawState.isDrawing && drawState.vertices.length >= 3 && (
          <View style={styles.drawActions}>
            <TouchableOpacity style={styles.drawUndoBtn} onPress={undoDrawVertex}>
              <Text style={styles.drawActionText}>↩️ Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawFinishBtn} onPress={handleFinishDraw}>
              <Text style={styles.drawFinishText}>✅ Finish Drawing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawCancelBtn} onPress={cancelDrawing}>
              <Text style={styles.drawActionText}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Mode Actions (floating bottom) */}
        {editState.isEditing && (
          <View style={styles.drawActions}>
            <TouchableOpacity style={styles.drawUndoBtn} onPress={undoEdit}>
              <Text style={styles.drawActionText}>↩️ Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawFinishBtn} onPress={handleSaveBoundary}>
              <Text style={styles.drawFinishText}>💾 Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawCancelBtn} onPress={cancelEditing}>
              <Text style={styles.drawActionText}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Detail Panel */}
        {panelState.isOpen && panelState.mode === 'detail' && selectedField && (
          <FieldDetailPanel
            field={selectedField}
            onClose={closePanel}
            onEdit={handleEditMetadata}
            onDelete={handleDeleteRequest}
            onStartEditing={handleStartEditBoundary}
            onConfigureZones={handleConfigureZones}
          />
        )}

        {/* Create Drawer */}
        {panelState.isOpen && panelState.mode === 'create' && (
          <CreateFieldDrawer
            activeTab={panelState.createMethod || 'draw'}
            onTabChange={(tab) => {
              setCreateMethod(tab);
              if (tab === 'draw' && !drawState.isDrawing) {
                startDrawing();
              }
            }}
            drawVertices={drawState.vertices}
            onSave={handleSaveField}
            onCancel={handleCancelCreate}
            isSaving={isSaving}
          />
        )}
        </div>
      </div>

      {/* ═══ Bottom KPI Bar ═══ */}
      <View style={styles.kpiBar}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>{totalFields}</Text>
          <Text style={styles.kpiLabel}>Fields</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>{totalArea.toFixed(1)}</Text>
          <Text style={styles.kpiLabel}>Hectares</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>{activeFields}</Text>
          <Text style={styles.kpiLabel}>Active</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>{totalFields - activeFields}</Text>
          <Text style={styles.kpiLabel}>Inactive</Text>
        </View>
      </View>

      {/* ═══ Toast Notification ═══ */}
      {toast && (
        <View style={[styles.toast, toast.type === 'error' && styles.toastError, toast.type === 'success' && styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={clearToast}>
            <Text style={styles.toastDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══ Delete Confirmation Dialog ═══ */}
      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete Field?"
        message={`"${deleteTarget?.name}" will be moved to trash. You can restore it within 30 days.`}
        confirmLabel="🗑️ Move to Trash"
        cancelLabel="Cancel"
        confirmColor="#C62828"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  saveBoundaryBtn: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBoundaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Map Area
  mapArea: { flex: 1, position: 'relative' },

  // Draw/Edit Actions (floating bottom)
  drawActions: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -180 }],
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
    gap: 8,
  },
  drawUndoBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F5F5F5' },
  drawFinishBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: '#4CAF50' },
  drawFinishText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  drawCancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFEBEE' },
  drawActionText: { fontSize: 13, color: '#333', fontWeight: '500' },

  // Bottom KPI Bar
  kpiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 20,
  },
  kpiItem: { alignItems: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  kpiLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  kpiDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0' },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 2000,
  },
  toastError: { backgroundColor: '#C62828' },
  toastSuccess: { backgroundColor: '#2E7D32' },
  toastText: { color: '#fff', fontSize: 13, flex: 1 },
  toastDismiss: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 12 },
});