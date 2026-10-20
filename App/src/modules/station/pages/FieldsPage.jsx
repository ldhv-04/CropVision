/**
 * FieldsPage — Tactical Agronomy GIS Command Workstation.
 * Decomposed container component conforming to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import useFieldGISStore from '../stores/fieldGISStore';
import useFieldCRUD from '../hooks/useFieldCRUD';
import StationMapCanvasMapLibre from '../components/gis/StationMapCanvasMapLibre';
import MapToolbar from '../components/gis/MapToolbar';
import LayerControls from '../components/gis/LayerControls';
import FieldDetailPanel from '../components/gis/FieldDetailPanel';
import CreateFieldDrawer from '../components/gis/CreateFieldDrawer';
import ConfirmationDialog from '../components/gis/ConfirmationDialog';
import FieldExplorerPanel from '../components/gis/explorer/FieldExplorerPanel';
import ZoneEditorPage from './ZoneEditorPage';
import { styles } from './fields/styles';
import { FieldsHeader } from './fields/FieldsHeader';
import { FieldsTelemetryBar } from './fields/FieldsTelemetryBar';
import { FieldsDrawHud } from './fields/FieldsDrawHud';

export default function FieldsPage() {
  const {
    fields, selectedFieldId, hoveredFieldId, isLoading, center, zoom,
    activeTool, drawState, editState, layers, adminLayers, panelState,
    setSelectedField, setHoveredField, clearSelection, setActiveTool,
    setViewport, setLayer, toggleAdminLayer, openPanel, closePanel,
    setCreateMethod, addDrawVertex, undoDrawVertex, finishDrawing, cancelDrawing,
    updateEditVertex, showToast, clearToast,
  } = useFieldGISStore();

  const { fetchFields, createField, deleteField } = useFieldCRUD();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [zoneEditorFieldId, setZoneEditorFieldId] = useState(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleFieldSelect = useCallback((id) => {
    setSelectedField(id);
    if (id) openPanel('detail');
  }, [setSelectedField, openPanel]);

  const handleStartDraw = useCallback(() => {
    setCreateMethod('draw');
    setActiveTool('draw');
    closePanel();
  }, [setCreateMethod, setActiveTool, closePanel]);

  const handleFinishDraw = useCallback(() => {
    const poly = finishDrawing();
    if (poly) openPanel('create');
  }, [finishDrawing, openPanel]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const ok = await deleteField(deleteTarget.id);
    if (ok) {
      showToast('Field removed from active telemetry', 'success');
      clearSelection();
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteField, showToast, clearSelection]);

  if (zoneEditorFieldId) {
    return <ZoneEditorPage fieldId={zoneEditorFieldId} onBack={() => setZoneEditorFieldId(null)} />;
  }

  if (isLoading && fields.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F5A0" />
        <Text style={styles.loadingText}>INITIALIZING CADASTRAL TELEMETRY...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FieldsHeader onNewField={() => openPanel('create')} />
      <View style={styles.workspace}>
        <FieldExplorerPanel
          fields={fields}
          selectedFieldId={selectedFieldId}
          hoveredFieldId={hoveredFieldId}
          onSelectField={handleFieldSelect}
          onHoverField={setHoveredField}
        />
        <View style={styles.mapViewport}>
          <StationMapCanvasMapLibre
            fields={fields}
            selectedFieldId={selectedFieldId}
            hoveredFieldId={hoveredFieldId}
            activeTool={activeTool}
            drawState={drawState}
            editState={editState}
            layers={layers}
            adminLayers={adminLayers}
            center={center}
            zoom={zoom}
            onFieldSelect={handleFieldSelect}
            onFieldHover={setHoveredField}
            onMapClick={addDrawVertex}
            onMapMove={setViewport}
            onEditVertexDrag={updateEditVertex}
            onMapRef={(map) => { mapInstanceRef.current = map; }}
          />
          <MapToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onStartDraw={handleStartDraw}
            canUndo={drawState.vertices?.length > 0}
            onUndo={undoDrawVertex}
          />
          <LayerControls
            layers={layers}
            adminLayers={adminLayers}
            onToggleLayer={setLayer}
            onToggleAdminLayer={toggleAdminLayer}
          />
          <FieldsDrawHud
            activeTool={activeTool}
            vertexCount={drawState.vertices?.length || 0}
            onUndo={undoDrawVertex}
            onFinish={handleFinishDraw}
            onCancel={cancelDrawing}
          />
        </View>
        {panelState === 'detail' && (
          <FieldDetailPanel
            fieldId={selectedFieldId}
            onClose={closePanel}
            onOpenZoneEditor={(fid) => setZoneEditorFieldId(fid)}
            onDelete={(f) => setDeleteTarget(f)}
          />
        )}
        {panelState === 'create' && (
          <CreateFieldDrawer
            isOpen={true}
            onClose={closePanel}
            drawnBoundary={drawState.completedBoundary}
            onSave={createField}
          />
        )}
      </View>
      <FieldsTelemetryBar fields={fields} />
      {deleteTarget && (
        <ConfirmationDialog
          title="DECOMMISSION SECTOR"
          message={`Confirm deletion of sector [${deleteTarget.name}].`}
          confirmLabel="CONFIRM"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
