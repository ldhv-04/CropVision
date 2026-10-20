/**
 * ZoneDetailPanel — Inspector panel for editing zone properties.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { S } from './styles';

export function ZoneDetailPanel({
  selectedZone,
  editZoneName,
  setEditZoneName,
  editZoneCode,
  setEditZoneCode,
  onSaveMeta,
  onDeleteZone,
  isSaving,
}) {
  if (!selectedZone) {
    return (
      <div style={S.rightPanel}>
        <div style={S.emptyState}>
          <p style={S.emptyTitle}>No Zone Selected</p>
          <p style={S.emptyDesc}>Click a zone on the map or list to inspect details.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.rightPanel}>
      <div style={S.panelHeader}>
        <h3 style={S.panelTitle}>Zone Details</h3>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: '700', color: '#666' }}>CODE</label>
          <input
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D5DDE5', marginTop: 4 }}
            value={editZoneCode}
            onChange={(e) => setEditZoneCode(e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: '700', color: '#666' }}>NAME</label>
          <input
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D5DDE5', marginTop: 4 }}
            value={editZoneName}
            onChange={(e) => setEditZoneName(e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: '700', color: '#666' }}>AREA</label>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, fontWeight: '600' }}>
            {selectedZone.area ? `${parseFloat(selectedZone.area).toFixed(2)} ha` : '0 ha'}
          </p>
        </div>
        <button
          style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: '#1976D2', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', marginTop: 8 }}
          onClick={onSaveMeta}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Details'}
        </button>
        <button
          style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', cursor: 'pointer', fontWeight: '700', marginTop: 4 }}
          onClick={() => onDeleteZone(selectedZone.id)}
        >
          Delete Zone
        </button>
      </div>
    </div>
  );
}
