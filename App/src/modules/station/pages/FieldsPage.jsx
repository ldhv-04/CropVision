/**
 * FieldsPage — GIS-Based Field Management (Tactical Agronomy Command)
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Vector-based Cadastral Grid & Geographic Information System.
 */

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';

// Store & Hooks
import useFieldGISStore, { selectMapFields } from '../stores/fieldGISStore';
import useFieldCRUD from '../hooks/useFieldCRUD';

// GIS Components
import StationMapCanvasMapLibre from '../components/gis/StationMapCanvasMapLibre';
import MapToolbar from '../components/gis/MapToolbar';
import LayerControls from '../components/gis/LayerControls';
import FieldDetailPanel from '../components/gis/FieldDetailPanel';
import CreateFieldDrawer from '../components/gis/CreateFieldDrawer';
import ConfirmationDialog from '../components/gis/ConfirmationDialog';
import FieldExplorerPanel from '../components/gis/explorer/FieldExplorerPanel';
import ZoneEditorPage from './ZoneEditorPage';
import { extractPolygonCoords, calculateAreaHectares } from '../utils/fieldGeometry';
import { FIELD_FOCUS_ZOOM, clampZoom } from '../config/mapConfig';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

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
    undoEdit,
    cancelEditing,
    showToast,
    clearToast,
    setSearchQuery,
    toggleExplorer,
  } = useFieldGISStore();

  const { fetchFields, createField, updateField: updateFieldAPI, deleteField } = useFieldCRUD();

  // ── Local state ──────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [zoneEditorFieldId, setZoneEditorFieldId] = useState(null);

  const mapInstanceRef = useRef(null);

  const handleMapRef = useCallback((map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleExplorerFlyTo = useCallback(
    (centroid, zoomLevel) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const safeZoom = clampZoom(zoomLevel || FIELD_FOCUS_ZOOM);
      map.flyTo({
        center: [centroid[1], centroid[0]],
        zoom: safeZoom,
        duration: 800,
      });
    },
    []
  );

  const handleFieldSelectFromMap = useCallback(
    (id) => {
      if (drawState.isDrawing || editState.isEditing) return;
      setSelectedField(id);
      openPanel('detail');
    },
    [drawState.isDrawing, editState.isEditing, setSelectedField, openPanel]
  );

  const handleMapFieldHover = useCallback(
    (id) => {
      setHoveredField(id);
    },
    [setHoveredField]
  );

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

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

  const filteredFields = useMemo(
    () => selectMapFields({ fields, filters }),
    [fields, filters]
  );

  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId),
    [fields, selectedFieldId]
  );

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
        // Error handled
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

  const handleConfigureZones = useCallback(() => {
    if (!selectedField) return;
    setZoneEditorFieldId(selectedField.id);
    closePanel();
  }, [selectedField, closePanel]);

  const handleBackFromZoneEditor = useCallback(() => {
    setZoneEditorFieldId(null);
    fetchFields();
  }, [fetchFields]);

  const handleEditMetadata = useCallback(() => {
    if (!selectedField) return;
    showToast('Use Configure Zones instead', 'info');
  }, [selectedField, showToast]);

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

  const totalFields = fields.length;
  const totalArea = useMemo(
    () => fields.reduce((sum, f) => {
      const coords = extractPolygonCoords(f.boundary);
      return sum + calculateAreaHectares(coords);
    }, 0),
    [fields]
  );
  const activeFields = useMemo(() => fields.filter((f) => f.status === 'ACTIVE' || !f.status).length, [fields]);

  if (isLoading && fields.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TACTICAL_THEME.radar} />
        <Text style={styles.loadingText}>[INITIALIZING SATELLITE CADASTRE & GIS VECTOR LAYERS...]</Text>
      </View>
    );
  }

  if (zoneEditorFieldId) {
    return (
      <View style={[styles.container, { overflow: 'hidden' }]}>
        <ZoneEditorPage fieldId={zoneEditorFieldId} onBack={handleBackFromZoneEditor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { overflow: 'hidden' }]}>
      {/* ═══ Tactical Header Bar ═══ */}
      <View style={styles.headerBar}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.headerIcon}>🌾</Text>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: '800', color: TACTICAL_THEME.radar, fontFamily: TACTICAL_THEME.fontMono, letterSpacing: '1px' }}>
              SPATIAL CADASTRAL SYSTEM
            </div>
            <Text style={styles.headerTitle}>FIELD VECTOR GRID & ZONING</Text>
          </div>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleStartCreate}>
            <Text style={styles.headerBtnText}>+ REGISTER NEW SECTOR</Text>
          </TouchableOpacity>
          {editState.isEditing && (
            <TouchableOpacity style={styles.saveBoundaryBtn} onPress={handleSaveBoundary}>
              <Text style={styles.saveBoundaryText}>💾 PERSIST BOUNDARY VECTORS</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ═══ Explorer + Map Grid ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        {/* Field Explorer Panel */}
        <FieldExplorerPanel
          fields={fields}
          selectedFieldId={selectedFieldId}
          hoveredFieldId={hoveredFieldId}
          searchQuery={searchQuery}
          explorerCollapsed={explorerCollapsed}
          filters={filters}
          setSelectedField={(id) => {
            setSelectedField(id);
            if (id) openPanel('detail');
          }}
          setHoveredField={setHoveredField}
          setSearchQuery={setSearchQuery}
          toggleExplorer={toggleExplorer}
          setFilter={setFilter}
          onFlyToField={handleExplorerFlyTo}
        />

        {/* Map Canvas with Tactical HUD */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: TACTICAL_THEME.bgBase }}>
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

          {/* Floating HUD Overlays */}
          <MapToolbar activeTool={activeTool} onToolChange={handleToolChange} />
          <LayerControls
            layers={layers}
            adminLayers={adminLayers}
            onLayerChange={setLayer}
            onAdminLayerToggle={toggleAdminLayer}
          />

          {/* Draw Mode Actions (floating bottom HUD) */}
          {activeTool === 'draw' && drawState.isDrawing && drawState.vertices.length >= 3 && (
            <View style={styles.drawActions}>
              <TouchableOpacity style={styles.drawUndoBtn} onPress={undoDrawVertex}>
                <Text style={styles.drawActionText}>↩ UNDO NODE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawFinishBtn} onPress={handleFinishDraw}>
                <Text style={styles.drawFinishText}>✓ CLOSE POLYGON</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawCancelBtn} onPress={cancelDrawing}>
                <Text style={styles.drawCancelText}>✕ ABORT</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Edit Mode Actions (floating bottom HUD) */}
          {editState.isEditing && (
            <View style={styles.drawActions}>
              <TouchableOpacity style={styles.drawUndoBtn} onPress={undoEdit}>
                <Text style={styles.drawActionText}>↩ UNDO EDIT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawFinishBtn} onPress={handleSaveBoundary}>
                <Text style={styles.drawFinishText}>💾 PERSIST VECTORS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawCancelBtn} onPress={cancelEditing}>
                <Text style={styles.drawCancelText}>✕ CANCEL</Text>
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

      {/* ═══ Bottom Telemetry KPI Bar ═══ */}
      <View style={styles.kpiBar}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>{totalFields}</Text>
          <Text style={styles.kpiLabel}>TOTAL SECTORS</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: TACTICAL_THEME.satellite }]}>{totalArea.toFixed(1)} ha</Text>
          <Text style={styles.kpiLabel}>HECTARE FOOTPRINT</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: TACTICAL_THEME.radar }]}>{activeFields}</Text>
          <Text style={styles.kpiLabel}>ACTIVE BIOMASS</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: TACTICAL_THEME.telemetry }]}>{totalFields - activeFields}</Text>
          <Text style={styles.kpiLabel}>FALLOW / IDLE</Text>
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
        title="PURGE SECTOR VECTOR?"
        message={`"${deleteTarget?.name}" will be flagged for deletion and archived.`}
        confirmLabel="🗑️ CONFIRM PURGE"
        cancelLabel="CANCEL"
        confirmColor={TACTICAL_THEME.alert}
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TACTICAL_THEME.bgBase },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TACTICAL_THEME.bgBase,
    gap: 12,
  },
  loadingText: {
    fontSize: 11,
    color: TACTICAL_THEME.radar,
    fontFamily: TACTICAL_THEME.fontMono,
    fontWeight: '700',
    letterSpacing: '1px',
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: TACTICAL_THEME.bgPanelSolid,
    borderBottomWidth: 1,
    borderBottomColor: TACTICAL_THEME.border,
    zIndex: 100,
  },
  headerIcon: { fontSize: 20 },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TACTICAL_THEME.textPrimary,
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: '0.5px',
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: {
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.radar,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 5,
  },
  headerBtnText: {
    color: TACTICAL_THEME.radar,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  saveBoundaryBtn: {
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.telemetry,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 5,
  },
  saveBoundaryText: {
    color: TACTICAL_THEME.telemetry,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TACTICAL_THEME.fontMono,
  },

  // Draw/Edit Actions (floating bottom HUD)
  drawActions: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -190 }],
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 19, 32, 0.94)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1000,
    gap: 8,
  },
  drawUndoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
  },
  drawFinishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: TACTICAL_THEME.radar,
  },
  drawFinishText: {
    color: '#06090E',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  drawCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 46, 84, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 46, 84, 0.3)',
  },
  drawActionText: {
    fontSize: 10.5,
    color: TACTICAL_THEME.textSecondary,
    fontWeight: '700',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  drawCancelText: {
    fontSize: 10.5,
    color: TACTICAL_THEME.alert,
    fontWeight: '700',
    fontFamily: TACTICAL_THEME.fontMono,
  },

  // Bottom Telemetry KPI Bar
  kpiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: TACTICAL_THEME.bgPanelSolid,
    borderTopWidth: 1,
    borderTopColor: TACTICAL_THEME.border,
    gap: 28,
  },
  kpiItem: { alignItems: 'center' },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: TACTICAL_THEME.textPrimary,
    fontFamily: TACTICAL_THEME.fontMono,
  },
  kpiLabel: {
    fontSize: 8.5,
    color: TACTICAL_THEME.textMuted,
    marginTop: 1,
    fontWeight: '700',
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: 0.8,
  },
  kpiDivider: { width: 1, height: 20, backgroundColor: TACTICAL_THEME.borderSubtle },

  // Toast HUD
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: TACTICAL_THEME.bgPanelElevated,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.radar,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2000,
  },
  toastError: { borderColor: TACTICAL_THEME.alert, backgroundColor: TACTICAL_THEME.alertMuted },
  toastSuccess: { borderColor: TACTICAL_THEME.radar, backgroundColor: TACTICAL_THEME.radarMuted },
  toastText: { color: TACTICAL_THEME.textPrimary, fontSize: 12, flex: 1, fontFamily: TACTICAL_THEME.fontMono },
  toastDismiss: { color: TACTICAL_THEME.textMuted, fontSize: 14, fontWeight: '700', marginLeft: 12 },
});
