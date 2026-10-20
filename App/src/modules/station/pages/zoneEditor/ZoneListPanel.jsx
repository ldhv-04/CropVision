/**
 * ZoneListPanel — Sidebar displaying list of zones and coverage.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { S } from './styles';

const ZONE_COLORS = [
  '#1976D2', '#4CAF50', '#FF9800', '#9C27B0',
  '#F44336', '#00BCD4', '#795548', '#607D8B',
];

export function ZoneListPanel({
  zones = [],
  selectedZoneId,
  onSelectZone,
  onAddZone,
  coverage,
  totalZoneArea,
  fieldArea,
}) {
  return (
    <div style={S.leftPanel}>
      <div style={S.panelHeader}>
        <h3 style={S.panelTitle}>Zones ({zones.length})</h3>
        <button style={S.addZoneBtn} onClick={onAddZone}>+ Add Zone</button>
      </div>
      <div style={S.zoneList}>
        {zones.length === 0 ? (
          <div style={S.emptyState}>
            <p style={S.emptyTitle}>No zones defined</p>
            <p style={S.emptyDesc}>Draw zones to partition field management.</p>
          </div>
        ) : (
          zones.map((zone, idx) => {
            const isSelected = String(zone.id) === String(selectedZoneId);
            const color = ZONE_COLORS[idx % ZONE_COLORS.length];
            return (
              <div
                key={zone.id}
                style={{ ...S.zoneItem, ...(isSelected ? S.zoneItemSelected : {}) }}
                onClick={() => onSelectZone(zone.id)}
              >
                <div style={S.zoneColorDot(color)} />
                <div style={S.zoneItemInfo}>
                  <p style={S.zoneItemCode}>{zone.code || `Zone ${idx + 1}`}</p>
                  <p style={S.zoneItemName}>{zone.name || 'Unnamed'}</p>
                  <p style={S.zoneItemArea}>{zone.area ? `${parseFloat(zone.area).toFixed(2)} ha` : '0 ha'}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #E0E0E0', fontSize: 11, color: '#666' }}>
        Coverage: <strong>{coverage}%</strong> ({totalZoneArea.toFixed(1)} / {fieldArea.toFixed(1)} ha)
      </div>
    </div>
  );
}
