import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { extractPolygonCoords } from '../../utils/mapHelpers';
import useLayerColor from '../../hooks/useLayerColor';

/**
 * ZonePolygon — Renders a single zone polygon on the map with dynamic color.
 *
 * Memoized: only re-renders when zone data, activeLayer, or selection changes.
 * Platform-split: Leaflet on web, react-native-maps on mobile.
 */
const ZonePolygon = React.memo(function ZonePolygon({ zone, activeLayer, isSelected, onPress, platform }) {
  const { color } = useLayerColor(zone);

  const coords = useMemo(() => extractPolygonCoords(zone.boundary), [zone.boundary]);

  if (!coords || coords.length === 0) return null;

  const fillColor = color;
  const strokeColor = isSelected ? '#ffffff' : color;
  const fillOpacity = isSelected ? 0.5 : 0.3;
  const strokeWeight = isSelected ? 3 : 1.5;

  if (platform === 'web') {
    return <LeafletZonePolygon coords={coords} fillColor={fillColor} strokeColor={strokeColor} fillOpacity={fillOpacity} strokeWeight={strokeWeight} onPress={onPress} />;
  }

  return <NativeZonePolygon coords={coords} fillColor={fillColor} strokeColor={strokeColor} fillOpacity={fillOpacity} strokeWeight={strokeWeight} onPress={onPress} />;
});

/**
 * Leaflet implementation for web.
 */
function LeafletZonePolygon({ coords, fillColor, strokeColor, fillOpacity, strokeWeight, onPress }) {
  const { Polygon } = require('react-leaflet');

  return (
    <Polygon
      positions={coords}
      pathOptions={{
        fillColor,
        color: strokeColor,
        weight: strokeWeight,
        fillOpacity,
        opacity: 0.8,
      }}
      eventHandlers={{
        click: onPress,
      }}
    />
  );
}

/**
 * react-native-maps implementation for mobile.
 */
function NativeZonePolygon({ coords, fillColor, strokeColor, fillOpacity, strokeWeight, onPress }) {
  const { Polygon } = require('react-native-maps');

  // Convert [lat, lng] to {latitude, longitude}
  const coordinates = coords.map(([lat, lng]) => ({
    latitude: lat,
    longitude: lng,
  }));

  return (
    <Polygon
      coordinates={coordinates}
      fillColor={fillColor}
      strokeColor={strokeColor}
      strokeWidth={strokeWeight}
      tappable
      onPress={onPress}
    />
  );
}

export default ZonePolygon;