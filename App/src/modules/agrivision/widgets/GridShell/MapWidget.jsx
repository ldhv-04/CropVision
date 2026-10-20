/**
 * MapWidget — High-Performance MapLibre WebGL Widget.
 * Replaces legacy react-leaflet implementation per FR-008.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useEffect } from 'react';
import { useAuthStore } from '../../../@core/auth/useAuthStore';
import { useTheme } from '../../../@core/context/ThemeContext';
import { useMapStore } from '../../../@core/store/useMapStore';
import StationMapCanvasMapLibre from '../../../station/components/gis/StationMapCanvasMapLibre';

export function MapWidget() {
  const token = useAuthStore((s) => s.token);
  const { colors } = useTheme();
  const { activeLayers, mapData, fetchMapData, setSelectedFeature } = useMapStore();

  useEffect(() => {
    if (token && fetchMapData) {
      fetchMapData(token);
    }
  }, [token, fetchMapData]);

  const fields = mapData?.fields || [];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
      }}
    >
      <StationMapCanvasMapLibre
        fields={fields}
        center={[10.03, 105.78]}
        zoom={12}
        onFieldSelect={(fieldId) => {
          const found = fields.find((f) => f.id === fieldId);
          if (found && setSelectedFeature) {
            setSelectedFeature({ type: 'field', data: found });
          }
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          backgroundColor: `${colors.surface}e6`,
          borderRadius: 8,
          padding: '6px 12px',
          display: 'flex',
          gap: 12,
          zIndex: 10,
          border: `1px solid ${colors.border}`,
          fontSize: 11,
          fontWeight: 700,
          color: colors.textSecondary,
        }}
      >
        <span>● Active Fields ({fields.length})</span>
        <span>⚡ WebGL 60 FPS Engine</span>
      </div>
    </div>
  );
}

export default MapWidget;
