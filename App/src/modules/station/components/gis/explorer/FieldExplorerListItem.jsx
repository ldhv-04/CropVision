/**
 * FieldExplorerListItem — Single field item in the explorer list.
 *
 * Displays field name, crop type, status, area, and code.
 * Supports click-to-select, hover-to-highlight, and scroll-into-view.
 *
 * Debug logs: [Explorer]
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { extractPolygonCoords, calculateAreaHectares, formatArea } from '../../../utils/fieldGeometry';

const STATUS_COLORS = {
  ACTIVE: '#4CAF50',
  INACTIVE: '#9E9E9E',
  FALLOW: '#795548',
};

const STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  FALLOW: 'Fallow',
};

export default function FieldExplorerListItem({
  field,
  isSelected,
  isHovered,
  onSelect,
  onHoverStart,
  onHoverEnd,
  itemRef,
}) {
  const internalRef = useRef(null);

  // Scroll into view when selected from map (Map → List sync)
  useEffect(() => {
    if (isSelected && internalRef.current) {
      console.log('[Explorer] List selection sync — scrolling to:', field.id);
      internalRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isSelected, field.id]);

  const handleClick = useCallback(() => {
    console.log('[Explorer] Field selected:', field.id, field.name);
    onSelect(field.id);
  }, [field.id, field.name, onSelect]);

  const handleMouseEnter = useCallback(() => {
    onHoverStart(field.id);
  }, [field.id, onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    onHoverEnd(field.id);
  }, [field.id, onHoverEnd]);

  // Calculate area
  const coords = extractPolygonCoords(field.boundary);
  const area = calculateAreaHectares(coords);
  const statusColor = STATUS_COLORS[field.status] || STATUS_COLORS.ACTIVE;
  const statusLabel = STATUS_LABELS[field.status] || 'Active';

  return (
    <div
      ref={(el) => {
        internalRef.current = el;
        if (itemRef) itemRef(el);
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        cursor: 'pointer',
        backgroundColor: isSelected
          ? '#E3F2FD'
          : isHovered
          ? '#F5F5F5'
          : 'transparent',
        borderLeft: isSelected ? '3px solid #1976D2' : '3px solid transparent',
        borderBottom: '1px solid #F0F0F0',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        gap: 10,
        minHeight: 56,
      }}
      data-testid={`explorer-item-${field.id}`}
    >
      {/* Status indicator dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: statusColor,
          flexShrink: 0,
        }}
      />

      {/* Field info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: isSelected ? 600 : 500,
            color: '#1a1a1a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {field.name || 'Unnamed Field'}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 2,
          }}
        >
          {field.crop_type && (
            <span style={{ fontSize: 11, color: '#666' }}>
              🌱 {field.crop_type}
            </span>
          )}
          {field.field_code && (
            <span style={{ fontSize: 10, color: '#999', fontFamily: 'monospace' }}>
              #{field.field_code}
            </span>
          )}
        </div>
      </div>

      {/* Area & status badge */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>
          {formatArea(area)}
        </div>
        <div
          style={{
            fontSize: 9,
            color: statusColor,
            fontWeight: 600,
            marginTop: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
}