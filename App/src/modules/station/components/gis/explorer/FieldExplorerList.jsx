/**
 * FieldExplorerList — Tactical Scrollable Field Ledger
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useCallback, useMemo, useRef, createRef } from 'react';
import FieldExplorerListItem from './FieldExplorerListItem';
import { TACTICAL_THEME } from '../../../constants/tacticalTheme';

export default function FieldExplorerList({
  fields,
  selectedFieldId,
  hoveredFieldId,
  onSelectField,
  onHoverField,
}) {
  const itemRefs = useRef({});

  const getFieldRef = useCallback((id) => {
    if (!itemRefs.current[id]) {
      itemRefs.current[id] = createRef();
    }
    return (el) => {
      itemRefs.current[id].current = el;
    };
  }, []);

  const stats = useMemo(() => {
    const active = fields.filter((f) => f.status === 'ACTIVE' || !f.status).length;
    return { total: fields.length, active };
  }, [fields]);

  if (fields.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: TACTICAL_THEME.textMuted,
          fontFamily: TACTICAL_THEME.fontMono,
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>⌕</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: TACTICAL_THEME.textSecondary }}>
          [NO SECTOR MATCHES]
        </div>
        <div style={{ fontSize: 10, color: TACTICAL_THEME.textMuted, marginTop: 4, textAlign: 'center' }}>
          Adjust search query or filter flags
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Field count header */}
      <div
        style={{
          padding: '6px 12px',
          fontSize: 9.5,
          color: TACTICAL_THEME.textMuted,
          fontWeight: 700,
          borderBottom: `1px solid ${TACTICAL_THEME.borderSubtle}`,
          backgroundColor: 'rgba(6, 9, 14, 0.4)',
          flexShrink: 0,
          fontFamily: TACTICAL_THEME.fontMono,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>COUNT: {stats.total} SECTORS</span>
        <span style={{ color: TACTICAL_THEME.radar }}>{stats.active} NOMINAL</span>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {fields.map((field) => (
          <FieldExplorerListItem
            key={field.id}
            field={field}
            isSelected={field.id === selectedFieldId}
            isHovered={field.id === hoveredFieldId}
            onSelect={onSelectField}
            onHoverStart={onHoverField}
            onHoverEnd={() => onHoverField(null)}
            itemRef={getFieldRef(field.id)}
          />
        ))}
      </div>
    </div>
  );
}
