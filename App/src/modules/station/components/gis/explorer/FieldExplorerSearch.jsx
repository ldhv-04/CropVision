/**
 * FieldExplorerSearch — Tactical Cadastral Search Input
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { TACTICAL_THEME } from '../../../constants/tacticalTheme';

export default function FieldExplorerSearch({ searchQuery, onSearchChange }) {
  const [localValue, setLocalValue] = useState(searchQuery);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (searchQuery !== localValue) {
      setLocalValue(searchQuery);
    }
  }, [searchQuery]);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalValue(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        console.log('[Explorer] Search changed:', value);
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    console.log('[Explorer] Search changed: (cleared)');
    onSearchChange('');
  }, [onSearchChange]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: '8px 10px',
        borderBottom: `1px solid ${TACTICAL_THEME.borderSubtle}`,
        backgroundColor: TACTICAL_THEME.bgPanelSolid,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: TACTICAL_THEME.bgInput,
          borderRadius: 6,
          padding: '0 8px',
          border: `1px solid ${TACTICAL_THEME.border}`,
          transition: 'border-color 0.15s ease',
        }}
      >
        <span style={{ fontSize: 12, color: TACTICAL_THEME.textMuted, marginRight: 6 }}>⌕</span>
        <input
          type="text"
          placeholder="Filter fields, crops, codes..."
          value={localValue}
          onChange={handleChange}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: 11.5,
            padding: '6px 0',
            color: TACTICAL_THEME.textPrimary,
            fontFamily: TACTICAL_THEME.fontFamily,
          }}
        />
        {localValue && (
          <button
            onClick={handleClear}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: TACTICAL_THEME.textMuted,
              cursor: 'pointer',
              fontSize: 12,
              padding: 4,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
