/**
 * ZoneEditorPage — Management Zone Editor (Station).
 * Decomposed orchestrator component conforming to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useZoneEditor from '../hooks/useZoneEditor';
import { extractPolygonCoords, calculateAreaHectares } from '../utils/fieldGeometry';
import { S } from './zoneEditor/styles';
import { ZoneListPanel } from './zoneEditor/ZoneListPanel';
import { ZoneDetailPanel } from './zoneEditor/ZoneDetailPanel';
import { ZoneEditorHeader } from './zoneEditor/ZoneEditorHeader';

export default function ZoneEditorPage({ fieldId, onBack }) {
  const {
    zones, parentField, isLoading, hasUnsavedChanges,
    fetchZones, updateZone, deleteZone, validateZones, publishZones,
  } = useZoneEditor(fieldId);

  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [activeTool, setActiveTool] = useState('pan');
  const [toast, setToast] = useState(null);
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneCode, setEditZoneCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const isMountedRef = useRef(false);

  const selectedZone = useMemo(
    () => zones.find((z) => String(z.id) === String(selectedZoneId)),
    [zones, selectedZoneId]
  );
  const fieldCoords = useMemo(
    () => extractPolygonCoords(parentField?.boundary),
    [parentField?.boundary]
  );
  const fieldArea = useMemo(
    () => (parentField?.area ? parseFloat(parentField.area) : calculateAreaHectares(fieldCoords)),
    [parentField?.area, fieldCoords]
  );
  const totalZoneArea = useMemo(
    () => zones.reduce((sum, z) => sum + (z.area ? parseFloat(z.area) : 0), 0),
    [zones]
  );
  const coverage = fieldArea > 0 ? ((totalZoneArea / fieldArea) * 100).toFixed(0) : '0';

  useEffect(() => {
    if (fieldId) fetchZones();
  }, [fieldId]);

  useEffect(() => {
    if (selectedZone) {
      setEditZoneName(selectedZone.name || '');
      setEditZoneCode(selectedZone.code || '');
    }
  }, [selectedZoneId, selectedZone]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || isMountedRef.current) return;
    isMountedRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm', minzoom: 3, maxzoom: 19 }],
      },
      center: [105.78, 10.03],
      zoom: 13,
      trackResize: true,
    });

    mapRef.current = map;
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isMountedRef.current = false;
      }
    };
  }, []);

  const handleSaveMeta = async () => {
    if (!selectedZone) return;
    setIsSaving(true);
    try {
      await updateZone(selectedZone.id, { name: editZoneName, code: editZoneCode });
      setToast({ message: 'Zone saved successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to save zone', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      await deleteZone(id);
      setSelectedZoneId(null);
      setToast({ message: 'Zone deleted', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete zone', type: 'error' });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div style={S.root}>
      <ZoneEditorHeader
        parentField={parentField}
        onBack={onBack}
        onValidate={validateZones}
        onPublish={publishZones}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <div style={S.workspace}>
        <ZoneListPanel
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          onAddZone={() => setActiveTool('draw')}
          coverage={coverage}
          totalZoneArea={totalZoneArea}
          fieldArea={fieldArea}
        />
        <div style={S.mapShell}>
          <div ref={containerRef} style={S.mapContainer} />
          <div style={S.floatingToolbar}>
            <button
              style={S.toolBtn(activeTool === 'pan')}
              onClick={() => setActiveTool('pan')}
              title="Pan Map"
            >
              ✋
            </button>
            <button
              style={S.toolBtn(activeTool === 'draw')}
              onClick={() => setActiveTool('draw')}
              title="Draw Zone"
            >
              ✏️
            </button>
          </div>
        </div>
        <ZoneDetailPanel
          selectedZone={selectedZone}
          editZoneName={editZoneName}
          setEditZoneName={setEditZoneName}
          editZoneCode={editZoneCode}
          setEditZoneCode={setEditZoneCode}
          onSaveMeta={handleSaveMeta}
          onDeleteZone={handleDeleteZone}
          isSaving={isSaving}
        />
      </div>
      {toast && <div style={S.toast(toast.type)}>{toast.message}</div>}
    </div>
  );
}
