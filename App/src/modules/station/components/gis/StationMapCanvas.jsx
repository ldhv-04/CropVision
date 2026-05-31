/**
 * StationMapCanvas — Platform-split map component for Station Field Management.
 *
 * Web/Electron: Leaflet.js (react-leaflet) with OSM tiles
 * Mobile (iOS/Android): react-native-maps
 *
 * Renders:
 * - Base map tiles (OSM / Satellite toggle)
 * - All field polygons with status-based coloring
 * - Draw preview polygon (during field creation)
 * - Edit vertices (during field editing)
 * - Map event handling (click, move, zoom)
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import FieldPolygon from './FieldPolygon';
import {
  extractPolygonCoords,
  calculateBounds,
  calculateAreaHectares,
  formatArea,
} from '../../utils/fieldGeometry';

// ── Tile layer URLs ─────────────────────────────────────────────
const TILE_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
};

export default function StationMapCanvas({
  fields = [],
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
  // Calculate bounds for all fields
  const allCoords = useMemo(() => {
    const coords = [];
    for (const field of fields) {
      const fc = extractPolygonCoords(field.boundary);
      coords.push(...fc);
    }
    return coords;
  }, [fields]);

  const bounds = useMemo(() => calculateBounds(allCoords), [allCoords]);

  if (Platform.OS === 'web') {
    return (
      <LeafletMap
        fields={fields}
        selectedFieldId={selectedFieldId}
        activeTool={activeTool}
        drawState={drawState}
        editState={editState}
        layers={layers}
        center={center}
        zoom={zoom}
        bounds={bounds}
        onFieldSelect={onFieldSelect}
        onMapClick={onMapClick}
        onMapMove={onMapMove}
        onEditVertexDrag={onEditVertexDrag}
      />
    );
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

// ════════════════════════════════════════════════════════════════
// LEAFLET MAP (Web/Electron)
// ════════════════════════════════════════════════════════════════

/**
 * Flag to distinguish programmatic map moves (e.g. fitBounds) from user-initiated
 * moves (drag/zoom). When true, the next moveend event is swallowed to prevent
 * writing programmatic viewport changes back to the Zustand store.
 */
let _isProgrammaticMove = false;

/**
 * FitBounds — Module-level component to preserve useRef across re-renders.
 * Defining this inside the parent function would create a NEW component type
 * on every render, resetting the useRef guard and causing an infinite loop.
 */
function FitBounds({ bounds, fields }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  const fitted = useRef(false);

  // Invalidate size on mount to fix tile rendering after flexbox layout settles
  useEffect(() => {
    const timer = setTimeout(() => {
      _isProgrammaticMove = true;
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (bounds && !fitted.current && fields.length > 0) {
      _isProgrammaticMove = true;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      fitted.current = true;
    }
  }, [bounds, fields.length]);

  return null;
}

/**
 * MapEvents — Module-level component to capture programmatic vs user moves.
 * Skips moveend events that were triggered programmatically to break the
 * infinite render loop.
 */
function MapEvents({ onMapMove, onMapClick, activeTool }) {
  const { useMapEvents } = require('react-leaflet');

  useMapEvents({
    moveend: (e) => {
      if (_isProgrammaticMove) {
        _isProgrammaticMove = false;
        return;
      }
      const map = e.target;
      const c = map.getCenter();
      onMapMove([c.lat, c.lng], map.getZoom());
    },
    click: (e) => {
      if (activeTool === 'draw') {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return null;
}

function LeafletMap({
  fields,
  selectedFieldId,
  activeTool,
  drawState,
  editState,
  layers,
  center,
  zoom,
  bounds,
  onFieldSelect,
  onMapClick,
  onMapMove,
  onEditVertexDrag,
}) {
  const {
    MapContainer,
    TileLayer,
    Polygon,
    CircleMarker,
    Polyline,
    useMap,
    useMapEvents,
  } = require('react-leaflet');
  const L = require('leaflet');

  // Load Leaflet CSS synchronously before first render.
  // This must be done before MapContainer mounts so tiles get correct positioning.
  // Using a module-level flag to avoid repeated injection.
  if (typeof document !== 'undefined' && !document.getElementById('leaflet-css-injected')) {
    try {
      const leafletPath = require('leaflet/dist/leaflet.css');
      // If require returned a string path, inject it via link tag
      if (typeof leafletPath === 'string') {
        const link = document.createElement('link');
        link.id = 'leaflet-css-injected';
        link.rel = 'stylesheet';
        link.href = leafletPath;
        document.head.appendChild(link);
      } else {
        // CSS loader injected it automatically via require
        const marker = document.createElement('style');
        marker.id = 'leaflet-css-injected';
        marker.textContent = '/* leaflet css loaded */';
        document.head.appendChild(marker);
      }
    } catch (e) {
      // Leaflet CSS not available via require — tiles may appear unstyled
    }
  }

  const tileConfig = TILE_LAYERS[layers.baseMap] || TILE_LAYERS.osm;

  // Cursor style based on active tool
  const cursorStyle = activeTool === 'draw' ? 'crosshair' : 'grab';

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', cursor: cursorStyle }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        zoomControl={false}
        doubleClickZoom={activeTool === 'pan'}
      >
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
        <MapEvents onMapMove={onMapMove} onMapClick={onMapClick} activeTool={activeTool} />
        <FitBounds bounds={bounds} fields={fields} />

        {/* Field polygons */}
        {layers.fields &&
          fields.map((field) => (
            <FieldPolygon
              key={field.id}
              field={field}
              isSelected={field.id === selectedFieldId}
              onSelect={onFieldSelect}
              platform="web"
            />
          ))}

        {/* Draw preview — live polygon as user clicks */}
        {activeTool === 'draw' && drawState.vertices.length > 0 && (
          <>
            {/* Lines connecting drawn vertices */}
            {drawState.vertices.length >= 2 && (
              <Polyline
                positions={drawState.vertices}
                pathOptions={{
                  color: '#2196F3',
                  weight: 2,
                  dashArray: '6 4',
                  opacity: 0.8,
                }}
              />
            )}

            {/* Preview polygon fill (show if ≥ 3 points) */}
            {drawState.vertices.length >= 3 && (
              <Polygon
                positions={drawState.vertices}
                pathOptions={{
                  fillColor: '#2196F3',
                  fillOpacity: 0.15,
                  color: '#2196F3',
                  weight: 2,
                  dashArray: '6 4',
                  opacity: 0.6,
                }}
              />
            )}

            {/* Vertex markers */}
            {drawState.vertices.map((pos, i) => (
              <CircleMarker
                key={`draw-vertex-${i}`}
                center={pos}
                radius={i === 0 ? 7 : 5}
                pathOptions={{
                  fillColor: i === 0 ? '#4CAF50' : '#2196F3',
                  fillOpacity: 1,
                  color: '#ffffff',
                  weight: 2,
                }}
              />
            ))}

            {/* Area tooltip near last vertex */}
            {drawState.vertices.length >= 3 && (
              <AreaTooltip vertices={drawState.vertices} />
            )}
          </>
        )}

        {/* Edit mode — show draggable vertices */}
        {activeTool === 'edit' && editState.isEditing && editState.currentVertices.length > 0 && (
          <>
            {/* Current polygon outline */}
            <Polygon
              positions={editState.currentVertices}
              pathOptions={{
                fillColor: '#FF9800',
                fillOpacity: 0.15,
                color: '#FF9800',
                weight: 2,
                opacity: 0.8,
              }}
            />

            {/* Vertex markers */}
            {editState.currentVertices.map((pos, i) => (
              <EditVertexMarker
                key={`edit-vertex-${i}`}
                position={pos}
                index={i}
                onDrag={onEditVertexDrag}
              />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}

/**
 * AreaTooltip — Floating tooltip showing live area calculation during drawing.
 */
function AreaTooltip({ vertices }) {
  const { Marker, Tooltip } = require('react-leaflet');
  const L = require('leaflet');

  const area = useMemo(() => calculateAreaHectares(vertices), [vertices]);
  const lastVertex = vertices[vertices.length - 1];

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'area-tooltip',
        html: `<div style="
          background: rgba(33,150,243,0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${formatArea(area)}</div>`,
        iconSize: [0, 0],
        iconAnchor: [10, -10],
      }),
    [area]
  );

  return (
    <Marker position={lastVertex} icon={icon} interactive={false} />
  );
}

/**
 * EditVertexMarker — Draggable vertex marker for polygon editing.
 */
function EditVertexMarker({ position, index, onDrag }) {
  const { CircleMarker, Marker, Tooltip } = require('react-leaflet');
  const L = require('leaflet');

  // Use a draggable marker
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'edit-vertex',
        html: `<div style="
          width: 14px; height: 14px;
          background: #FF9800;
          border: 2px solid #fff;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    []
  );

  return (
    <Marker
      position={position}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onEditVertexDrag(index, [lat, lng]);
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -10]}>
        V{index + 1}: {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </Tooltip>
    </Marker>
  );
}

// ════════════════════════════════════════════════════════════════
// NATIVE MAP (Mobile)
// ════════════════════════════════════════════════════════════════

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

  const region = useMemo(
    () => ({
      latitude: center[0],
      longitude: center[1],
      latitudeDelta: 0.01 * Math.pow(2, 15 - zoom),
      longitudeDelta: 0.01 * Math.pow(2, 15 - zoom),
    }),
    [center, zoom]
  );

  const handleRegionChange = useCallback(
    (newRegion) => {
      const newZoom = Math.round(15 - Math.log2(newRegion.latitudeDelta / 0.01));
      onMapMove([newRegion.latitude, newRegion.longitude], newZoom);
    },
    [onMapMove]
  );

  const handleMapPress = useCallback(
    (e) => {
      if (activeTool === 'draw') {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onMapClick([latitude, longitude]);
      }
    },
    [activeTool, onMapClick]
  );

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={region}
      onRegionChangeComplete={handleRegionChange}
      onPress={handleMapPress}
    >
      {layers.fields &&
        fields.map((field) => (
          <FieldPolygon
            key={field.id}
            field={field}
            isSelected={field.id === selectedFieldId}
            onSelect={onFieldSelect}
            platform="native"
          />
        ))}

      {/* Draw preview — live polygon as user clicks */}
      {activeTool === 'draw' && drawState.vertices.length > 0 && (
        <>
          {/* Lines connecting drawn vertices */}
          {drawState.vertices.length >= 2 && (
            <Polyline
              coordinates={drawState.vertices.map(v => ({ latitude: v[0], longitude: v[1] }))}
              strokeColor="#2196F3"
              strokeWidth={2}
              lineDashPattern={[6, 4]}
            />
          )}

          {/* Preview polygon fill (show if ≥ 3 points) */}
          {drawState.vertices.length >= 3 && (
            <Polygon
              coordinates={drawState.vertices.map(v => ({ latitude: v[0], longitude: v[1] }))}
              fillColor="rgba(33, 150, 243, 0.15)"
              strokeColor="#2196F3"
              strokeWidth={2}
              lineDashPattern={[6, 4]}
            />
          )}

          {/* Vertex markers */}
          {drawState.vertices.map((v, i) => (
            <Marker
              key={`draw-vertex-${i}`}
              coordinate={{ latitude: v[0], longitude: v[1] }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={{
                width: i === 0 ? 14 : 10,
                height: i === 0 ? 14 : 10,
                borderRadius: i === 0 ? 7 : 5,
                backgroundColor: i === 0 ? '#4CAF50' : '#2196F3',
                borderWidth: 2,
                borderColor: '#ffffff'
              }} />
            </Marker>
          ))}
        </>
      )}

      {/* Edit mode — show draggable vertices */}
      {activeTool === 'edit' && editState.isEditing && editState.currentVertices.length > 0 && (
        <>
          {/* Current polygon outline */}
          <Polygon
            coordinates={editState.currentVertices.map(v => ({ latitude: v[0], longitude: v[1] }))}
            fillColor="rgba(255, 152, 0, 0.15)"
            strokeColor="#FF9800"
            strokeWidth={2}
          />

          {/* Vertex markers */}
          {editState.currentVertices.map((v, i) => (
            <Marker
              key={`edit-vertex-${i}`}
              coordinate={{ latitude: v[0], longitude: v[1] }}
              anchor={{ x: 0.5, y: 0.5 }}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                onEditVertexDrag(i, [latitude, longitude]);
              }}
            >
              <View style={{
                width: 14,
                height: 14,
                backgroundColor: '#FF9800',
                borderRadius: 7,
                borderWidth: 2,
                borderColor: '#ffffff'
              }} />
            </Marker>
          ))}
        </>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});