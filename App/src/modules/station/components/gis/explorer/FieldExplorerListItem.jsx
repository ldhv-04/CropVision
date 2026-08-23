/**
 * FieldExplorerListItem — Tactical Cadastral Field Item
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { extractPolygonCoords, calculateAreaHectares, formatArea } from '../../../utils/fieldGeometry';
import { TACTICAL_THEME } from '../../../constants/tacticalTheme';

const STATUS_COLORS = {
  ACTIVE: TACTICAL_THEME.radar,
  INACTIVE: TACTICAL_THEME.textMuted,
  FALLOW: TACTICAL_THEME.telemetry,
};

const STATUS_LABELS = {
  ACTIVE: 'ACT',
  INACTIVE: 'OFF',
  FALLOW: 'FLW',
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

  // Scroll into view when selected from map
  useEffect(() => {
    if (isSelected && internalRef.current) {
      internalRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isSelected, field.id]);

  const handleClick = useCallback(() => {
    onSelect(field.id);
  }, [field.id, onSelect]);

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
  const statusLabel = STATUS_LABELS[field.status] || 'ACT';

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
        padding: '9px 12px',
        cursor: 'pointer',
        backgroundColor: isSelected
          ? 'rgba(0, 245, 160, 0.08)'
          : isHovered
          ? 'rgba(255, 255, 255, 0.03)'
          : 'transparent',
        borderLeft: isSelected ? `3px solid ${TACTICAL_THEME.radar}` : '3px solid transparent',
        borderBottom: `1px solid ${TACTICAL_THEME.borderSubtle}`,
        transition: 'all 0.15s ease',
        gap: 10,
        minHeight: 52,
      }}
      data-testid={`explorer-item-${field.id}`}
    >
      {/* Status indicator dot */}
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: statusColor,
          boxShadow: isSelected ? `0 0 6px ${statusColor}` : 'none',
          flexShrink: 0,
        }}
      />

      {/* Main Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{
            fontSize: 12,
            fontWeight: isSelected ? 800 : 600,
            color: isSelected ? TACTICAL_THEME.textPrimary : TACTICAL_THEME.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {field.name}
          </div>
          {field.code && (
            <span style={{
              fontSize: 8.5,
              fontWeight: 800,
              color: TACTICAL_THEME.satellite,
              backgroundColor: 'rgba(0, 210, 255, 0.1)',
              padding: '1px 4px',
              borderRadius: 2,
              fontFamily: TACTICAL_THEME.fontMono,
              flexShrink: 0,
            }}>
              {field.code}
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 2,
          fontSize: 10,
          color: TACTICAL_THEME.textMuted,
          fontFamily: TACTICAL_THEME.fontMono,
        }}>
          <span style={{ color: TACTICAL_THEME.textSecondary }}>{field.crop_type || 'Rice'}</span>
          <span>•</span>
          <span>{formatArea(area)}</span>
        </div>
      </div>

      {/* Status Tag */}
      <span style={{
        fontSize: 8,
        fontWeight: 800,
        color: statusColor,
        backgroundColor: `${statusColor}15`,
        padding: '2px 4px',
        borderRadius: 3,
        fontFamily: TACTICAL_THEME.fontMono,
      }}>
        {statusLabel}
      </span>
    </div>
  );
}
