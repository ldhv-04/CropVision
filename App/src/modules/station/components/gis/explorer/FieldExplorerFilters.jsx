/**
 * FieldExplorerFilters — Quick filter chips for the explorer.
 *
 * Filters by crop type and status. Compact chip-based UI.
 *
 * Debug logs: [Explorer]
 */

import React, { useCallback, useMemo } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active', color: '#4CAF50' },
  { value: 'INACTIVE', label: 'Inactive', color: '#9E9E9E' },
  { value: 'FALLOW', label: 'Fallow', color: '#795548' },
];

export default function FieldExplorerFilters({ fields, filters, onFilterChange }) {
  // Extract unique crop types from fields
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
        padding: '6px 12px 8px',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
      }}
    >
      {/* Status filter chips */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: '#999', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Status
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map((opt) => {
            const isActive = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  border: isActive ? '1px solid #1976D2' : '1px solid #E0E0E0',
                  backgroundColor: isActive ? '#E3F2FD' : '#FAFAFA',
                  color: isActive ? '#1976D2' : '#666',
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
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
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: opt.color,
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
          <div style={{ fontSize: 10, color: '#999', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Crop
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleCropChange('')}
              style={{
                padding: '3px 8px',
                borderRadius: 12,
                border: !filters.cropType ? '1px solid #1976D2' : '1px solid #E0E0E0',
                backgroundColor: !filters.cropType ? '#E3F2FD' : '#FAFAFA',
                color: !filters.cropType ? '#1976D2' : '#666',
                fontSize: 11,
                fontWeight: !filters.cropType ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All
            </button>
            {cropTypes.map((crop) => {
              const isActive = filters.cropType === crop;
              return (
                <button
                  key={crop}
                  onClick={() => handleCropChange(isActive ? '' : crop)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 12,
                    border: isActive ? '1px solid #1976D2' : '1px solid #E0E0E0',
                    backgroundColor: isActive ? '#E3F2FD' : '#FAFAFA',
                    color: isActive ? '#1976D2' : '#666',
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🌱 {crop}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}