/**
 * FieldPolygon — Renders a single field polygon on the Leaflet map.
 *
 * Displays field boundary with:
 * - Dynamic fill color based on status
 * - Selection highlight (white stroke)
 * - Click handler for selection
 * - Hover tooltip with field info
 *
 * Memoized: only re-renders when field data or selection changes.
 */

import React, { useMemo, useCallback } from 'react';
import { extractPolygonCoords, calculateCentroid, calculateAreaHectares, formatArea } from '../../utils/fieldGeometry';

const STATUS_COLORS = {
  ACTIVE: '#4CAF50',
  INACTIVE: '#9E9E9E',
  FALLOW: '#795548',
};

const HEALTH_COLORS = {
  healthy: '#4CAF50',
  warning: '#FF9800',
  critical: '#F44336',
};

function FieldPolygon({ field, isSelected, onSelect, platform }) {
  const coords = useMemo(() => extractPolygonCoords(field.boundary), [field.boundary]);
  const centroid = useMemo(() => calculateCentroid(coords), [coords]);
  const area = useMemo(() => calculateAreaHectares(coords), [coords]);

  const handleClick = useCallback(
    (e) => {
      if (e.originalEvent) {
        e.originalEvent.stopPropagation?.();
        e.originalEvent.preventDefault?.();
      }
      onSelect(field.id);
    },
    [field.id, onSelect]
  );

  if (!coords || coords.length === 0) return null;

  const baseColor = STATUS_COLORS[field.status] || STATUS_COLORS.ACTIVE;
  const fillColor = baseColor;
  const strokeColor = isSelected ? '#ffffff' : baseColor;
  const fillOpacity = isSelected ? 0.45 : 0.25;
  const strokeWeight = isSelected ? 3 : 2;

  if (platform === 'web') {
    return (
      <LeafletFieldPolygon
        coords={coords}
        fillColor={fillColor}
        strokeColor={strokeColor}
        fillOpacity={fillOpacity}
        strokeWeight={strokeWeight}
        isSelected={isSelected}
        field={field}
        area={area}
        centroid={centroid}
        onClick={handleClick}
      />
    );
  }

  return (
    <NativeFieldPolygon
      coords={coords}
      fillColor={fillColor}
      strokeColor={strokeColor}
      fillOpacity={fillOpacity}
      strokeWeight={strokeWeight}
      onClick={handleClick}
    />
  );
}

/**
 * Leaflet implementation for web.
 */
function LeafletFieldPolygon({ coords, fillColor, strokeColor, fillOpacity, strokeWeight, isSelected, field, area, centroid, onClick }) {
  const { Polygon, Tooltip, Marker } = require('react-leaflet');
  const L = require('leaflet');

  // Create a small centroid marker for selected fields
  const centroidIcon = useMemo(() => {
    if (!isSelected) return null;
    return L.divIcon({
      className: 'field-centroid-marker',
      html: `<div style="
        width: 8px; height: 8px;
        background: #fff;
        border: 2px solid ${fillColor};
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [8, 8],
      iconAnchor: [4, 4],
    });
  }, [isSelected, fillColor]);

  return (
    <>
      <Polygon
        positions={coords}
        pathOptions={{
          fillColor,
          color: strokeColor,
          weight: strokeWeight,
          fillOpacity,
          opacity: 0.85,
        }}
        eventHandlers={{
          click: onClick,
        }}
      >
        <Tooltip
          direction="top"
          offset={[0, -10]}
          opacity={0.95}
          permanent={isSelected}
        >
          <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
            <strong>{field.name}</strong>
            <br />
            <span style={{ color: '#666' }}>{field.crop_type}</span>
            <br />
            <span style={{ fontSize: '0.85em' }}>{formatArea(area)}</span>
          </div>
        </Tooltip>
      </Polygon>
      {isSelected && centroidIcon && (
        <Marker position={centroid} icon={centroidIcon} interactive={false} />
      )}
    </>
  );
}

/**
 * react-native-maps implementation for mobile.
 */
function NativeFieldPolygon({ coords, fillColor, strokeColor, fillOpacity, strokeWeight, onClick }) {
  const { Polygon } = require('react-native-maps');

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
      onPress={onClick}
    />
  );
}

export default React.memo(FieldPolygon);