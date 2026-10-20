/**
 * StationMapCanvas — Native/Fallback Map Component for Field Management.
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 * Web Station rendering is standardized on StationMapCanvasMapLibre (FR-008).
 * Mobile rendering uses React Native Maps.
 */

import React, { useMemo, useCallback } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import FieldPolygon from './FieldPolygon';

export default function StationMapCanvas(props) {
  const {
    fields = [],
    selectedFieldId,
    activeTool,
    drawState = { vertices: [] },
    editState = { isEditing: false, currentVertices: [] },
    layers = { fields: true },
    center = [10.03, 105.78],
    zoom = 13,
    onFieldSelect,
    onMapClick,
    onMapMove,
    onEditVertexDrag,
  } = props;

  if (Platform.OS === 'web') {
    const StationMapCanvasMapLibre = require('./StationMapCanvasMapLibre').default;
    return <StationMapCanvasMapLibre {...props} />;
  }

  return (
    <NativeMap
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

function NativeMap({
  fields,
  selectedFieldId,
  activeTool,
  drawState,
  editState,
  layers,
  center,
  zoom,
  onFieldSelect,
  onMapClick,
  onMapMove,
  onEditVertexDrag,
}) {
  const MapView = require('react-native-maps').default;
  const { PROVIDER_DEFAULT, Polygon, Polyline, Marker } = require('react-native-maps');

  const region = useMemo(() => ({
    latitude: center[0],
    longitude: center[1],
    latitudeDelta: 0.01 * Math.pow(2, 15 - zoom),
    longitudeDelta: 0.01 * Math.pow(2, 15 - zoom),
  }), [center, zoom]);

  const handleRegionChange = useCallback((newRegion) => {
    const newZoom = Math.round(15 - Math.log2(newRegion.latitudeDelta / 0.01));
    if (onMapMove) onMapMove([newRegion.latitude, newRegion.longitude], newZoom);
  }, [onMapMove]);

  const handleMapPress = useCallback((e) => {
    if (activeTool === 'draw' && onMapClick) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      onMapClick([latitude, longitude]);
    }
  }, [activeTool, onMapClick]);

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={region}
      onRegionChangeComplete={handleRegionChange}
      onPress={handleMapPress}
    >
      {layers.fields && fields.map((field) => (
        <FieldPolygon
          key={field.id}
          field={field}
          isSelected={field.id === selectedFieldId}
          onSelect={onFieldSelect}
          platform="native"
        />
      ))}
      {activeTool === 'draw' && drawState.vertices.length > 0 && (
        <DrawPreview vertices={drawState.vertices} />
      )}
      {activeTool === 'edit' && editState.isEditing && editState.currentVertices.length > 0 && (
        <EditPreview vertices={editState.currentVertices} onDrag={onEditVertexDrag} />
      )}
    </MapView>
  );
}

function DrawPreview({ vertices }) {
  const { Polygon, Polyline, Marker } = require('react-native-maps');
  return (
    <>
      {vertices.length >= 2 && (
        <Polyline
          coordinates={vertices.map(v => ({ latitude: v[0], longitude: v[1] }))}
          strokeColor="#2196F3"
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
      )}
      {vertices.length >= 3 && (
        <Polygon
          coordinates={vertices.map(v => ({ latitude: v[0], longitude: v[1] }))}
          fillColor="rgba(33, 150, 243, 0.15)"
          strokeColor="#2196F3"
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
      )}
      {vertices.map((v, i) => (
        <Marker
          key={`draw-v-${i}`}
          coordinate={{ latitude: v[0], longitude: v[1] }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[styles.vertexDot, i === 0 ? styles.firstVertexDot : null]} />
        </Marker>
      ))}
    </>
  );
}

function EditPreview({ vertices, onDrag }) {
  const { Polygon, Marker } = require('react-native-maps');
  return (
    <>
      <Polygon
        coordinates={vertices.map(v => ({ latitude: v[0], longitude: v[1] }))}
        fillColor="rgba(255, 152, 0, 0.15)"
        strokeColor="#FF9800"
        strokeWidth={2}
      />
      {vertices.map((v, i) => (
        <Marker
          key={`edit-v-${i}`}
          coordinate={{ latitude: v[0], longitude: v[1] }}
          anchor={{ x: 0.5, y: 0.5 }}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            if (onDrag) onDrag(i, [latitude, longitude]);
          }}
        >
          <View style={styles.editVertexDot} />
        </Marker>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: '100%', height: '100%' },
  vertexDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  firstVertexDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
  },
  editVertexDot: {
    width: 14,
    height: 14,
    backgroundColor: '#FF9800',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
