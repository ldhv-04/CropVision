/**
 * FieldExplorerFilters — Tactical Filter Chips
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useCallback, useMemo } from 'react';
import { TACTICAL_THEME } from '../../../constants/tacticalTheme';

const STATUS_OPTIONS = [
  { value: '', label: 'ALL' },
  { value: 'ACTIVE', label: 'ACTIVE', color: TACTICAL_THEME.radar },
  { value: 'INACTIVE', label: 'INACTIVE', color: TACTICAL_THEME.textMuted },
  { value: 'FALLOW', label: 'FALLOW', color: TACTICAL_THEME.telemetry },
];

export default function FieldExplorerFilters({ fields, filters, onFilterChange }) {
  const cropTypes = useMemo(() => {
    const types = new Set();
    fields.forEach((f) => {
      if (f.crop_type) types.add(f.crop_type);
    });
    return Array.from(types).sort();
  }, [fields]);

  const handleStatusChange = useCallback(
    (status) => {
      onFilterChange('status', status);
    },
    [onFilterChange]
  );

  const handleCropChange = useCallback(
    (cropType) => {
      onFilterChange('cropType', cropType);
    },
    [onFilterChange]
  );

  return (
    <div
      style={{
        padding: '6px 10px 8px',
        borderBottom: `1px solid ${TACTICAL_THEME.borderSubtle}`,
        backgroundColor: TACTICAL_THEME.bgPanelSolid,
        flexShrink: 0,
      }}
    >
      {/* Status filter chips */}
      <div style={{ marginBottom: 6 }}>
        <div style={{
          fontSize: 8.5,
          color: TACTICAL_THEME.textMuted,
          fontWeight: 800,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: TACTICAL_THEME.fontMono,
        }}>
          STATUS VECTOR
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map((opt) => {
            const isActive = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: isActive ? `1px solid ${TACTICAL_THEME.radar}` : `1px solid ${TACTICAL_THEME.border}`,
                  backgroundColor: isActive ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? TACTICAL_THEME.radar : TACTICAL_THEME.textSecondary,
                  fontSize: 9.5,
                  fontWeight: 700,
                  fontFamily: TACTICAL_THEME.fontMono,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {opt.color && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: opt.color,
                      boxShadow: isActive ? `0 0 5px ${opt.color}` : 'none',
                    }}
                  />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Crop type filter chips */}
      {cropTypes.length > 0 && (
        <div>
          <div style={{
            fontSize: 8.5,
            color: TACTICAL_THEME.textMuted,
            fontWeight: 800,
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: TACTICAL_THEME.fontMono,
          }}>
            CROP TAXONOMY
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleCropChange('')}
              style={{
                padding: '2px 7px',
                borderRadius: 4,
                border: !filters.cropType ? `1px solid ${TACTICAL_THEME.satellite}` : `1px solid ${TACTICAL_THEME.border}`,
                backgroundColor: !filters.cropType ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                color: !filters.cropType ? TACTICAL_THEME.satellite : TACTICAL_THEME.textSecondary,
                fontSize: 9.5,
                fontWeight: 700,
                fontFamily: TACTICAL_THEME.fontMono,
                cursor: 'pointer',
              }}
            >
              ALL
            </button>
            {cropTypes.map((crop) => {
              const isActive = filters.cropType === crop;
              return (
                <button
                  key={crop}
                  onClick={() => handleCropChange(crop)}
                  style={{
                    padding: '2px 7px',
                    borderRadius: 4,
                    border: isActive ? `1px solid ${TACTICAL_THEME.satellite}` : `1px solid ${TACTICAL_THEME.border}`,
                    backgroundColor: isActive ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    color: isActive ? TACTICAL_THEME.satellite : TACTICAL_THEME.textSecondary,
                    fontSize: 9.5,
                    fontWeight: 700,
                    fontFamily: TACTICAL_THEME.fontMono,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {crop}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
