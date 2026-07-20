/**
 * FieldExplorerSearch — Search input with 300ms debounce.
 *
 * Searches by field name, crop type, and field code.
 * Stores search state globally in Zustand.
 *
 * Debug logs: [Explorer]
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';

export default function FieldExplorerSearch({ searchQuery, onSearchChange }) {
  const [localValue, setLocalValue] = useState(searchQuery);
  const debounceTimerRef = useRef(null);
  const isInitialMount = useRef(true);

  // Sync local value from store when it changes externally (e.g., clearFilters)
  useEffect(() => {
    if (searchQuery !== localValue) {
      setLocalValue(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalValue(value);

      // Debounce: 300ms
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

  // Cleanup debounce timer on unmount
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
        padding: '8px 12px',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#F5F5F5',
          borderRadius: 8,
          padding: '0 10px',
          border: '1px solid #E0E0E0',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span style={{ fontSize: 14, color: '#999', marginRight: 6 }}>🔍</span>
        <input
          type="text"
          placeholder="Search fields, crops, codes..."
          value={localValue}
          onChange={handleChange}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: 13,
            padding: '8px 0',
            color: '#333',
            fontFamily: 'inherit',
          }}
        />
        {localValue && (
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: 14,
              color: '#999',
              lineHeight: 1,
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}