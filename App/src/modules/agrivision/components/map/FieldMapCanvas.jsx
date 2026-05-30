import React, { useMemo, useCallback } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import ZonePolygon from './ZonePolygon';
import { extractPolygonCoords, calculateFieldBounds } from '../../utils/mapHelpers';

/**
 * FieldMapCanvas — Platform-split map component.
 *
 * Web/Electron: Leaflet.js (react-leaflet)
 * Mobile (iOS/Android): react-native-maps
 *
 * Renders all zone polygons with dynamic color coding based on activeLayer.
 */
export default function FieldMapCanvas({
  zones = [],
  selectedZoneId,
  activeLayer,
  center,
  zoom,
  onZonePress,
  onMapMove,
}) {
  // Memoize bounds fitting
  const bounds = useMemo(() => calculateFieldBounds(zones), [zones]);

  if (Platform.OS === 'web') {
    return (
      <LeafletMap
        zones={zones}
        selectedZoneId={selectedZoneId}
        activeLayer={activeLayer}
        center={center}
        zoom={zoom}
        bounds={bounds}
        onZonePress={onZonePress}
        onMapMove={onMapMove}
      />
    );
  }

  return (
    <NativeMap
      zones={zones}
      selectedZoneId={selectedZoneId}
      activeLayer={activeLayer}
      center={center}
      zoom={zoom}
      bounds={bounds}
      onZonePress={onZonePress}
      onMapMove={onMapMove}
    />
  );
}

/**
 * LeafletMap — Web implementation using react-leaflet.
 */
function LeafletMap({ zones, selectedZoneId, activeLayer, center, zoom, bounds, onZonePress, onMapMove }) {
  // Dynamic import for web-only
  const { MapContainer, TileLayer, useMap, useMapEvents } = require('react-leaflet');
  const L = require('leaflet');

  // Map event handler component
  function MapEvents() {
    useMapEvents({
      moveend: (e) => {
        const map = e.target;
        const c = map.getCenter();
        onMapMove([c.lat, c.lng], map.getZoom());
      },
    });
    return null;
  }

  // Fit bounds on first render
  function FitBounds() {
    const map = useMap();
    React.useEffect(() => {
      if (bounds) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }, [bounds]);
    return null;
  }

  return (
    <View style={styles.map}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        <FitBounds />
        {zones.map((zone) => (
          <ZonePolygon
            key={zone.id}
            zone={zone}
            activeLayer={activeLayer}
            isSelected={zone.id === selectedZoneId}
            onPress={() => onZonePress(zone.id)}
            platform="web"
          />
        ))}
      </MapContainer>
    </View>
  );
}

/**
 * NativeMap — Mobile implementation using react-native-maps.
 */
function NativeMap({ zones, selectedZoneId, activeLayer, center, zoom, onZonePress, onMapMove }) {
  const MapView = require('react-native-maps').default;
  const { Polygon, PROVIDER_DEFAULT } = require('react-native-maps');

  const region = useMemo(() => ({
    latitude: center[0],
    longitude: center[1],
    latitudeDelta: 0.01 * Math.pow(2, 15 - zoom),
    longitudeDelta: 0.01 * Math.pow(2, 15 - zoom),
  }), [center, zoom]);

  const handleRegionChange = useCallback((newRegion) => {
    onMapMove([newRegion.latitude, newRegion.longitude], Math.round(15 - Math.log2(newRegion.latitudeDelta / 0.01)));
  }, [onMapMove]);

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={region}
      onRegionChangeComplete={handleRegionChange}
    >
      {zones.map((zone) => (
        <ZonePolygon
          key={zone.id}
          zone={zone}
          activeLayer={activeLayer}
          isSelected={zone.id === selectedZoneId}
          onPress={() => onZonePress(zone.id)}
          platform="native"
        />
      ))}
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