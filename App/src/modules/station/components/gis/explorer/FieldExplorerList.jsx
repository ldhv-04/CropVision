/**
 * FieldExplorerList — Scrollable list of field items.
 *
 * Renders filtered fields with virtualized-style rendering.
 * Handles selection sync from map (scroll-into-view).
 *
 * Debug logs: [Explorer]
 */

import React, { useCallback, useMemo, useRef, createRef } from 'react';
import FieldExplorerListItem from './FieldExplorerListItem';

export default function FieldExplorerList({
  fields,
  selectedFieldId,
  hoveredFieldId,
  onSelectField,
  onHoverField,
}) {
  const itemRefs = useRef({});

  // Build refs for each field
  const getFieldRef = useCallback((id) => {
    if (!itemRefs.current[id]) {
      itemRefs.current[id] = createRef();
    }
    return (el) => {
      itemRefs.current[id].current = el;
    };
  }, []);

  // Summary stats
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
          color: '#999',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>
          No fields found
        </div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 4, textAlign: 'center' }}>
          Try adjusting your search or filters
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
          fontSize: 11,
          color: '#888',
          fontWeight: 500,
          borderBottom: '1px solid #F0F0F0',
          backgroundColor: '#FAFAFA',
          flexShrink: 0,
        }}
      >
        {stats.total} field{stats.total !== 1 ? 's' : ''} · {stats.active} active
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