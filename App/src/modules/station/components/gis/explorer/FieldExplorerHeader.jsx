/**
 * FieldExplorerHeader — Header bar with title and collapse/expand toggle.
 *
 * Debug logs: [Explorer]
 */

import React, { useCallback } from 'react';

export default function FieldExplorerHeader({ isCollapsed, onToggle }) {
  const handleToggle = useCallback(() => {
    console.log(isCollapsed ? '[Explorer] Explorer expanded' : '[Explorer] Explorer collapsed');
    onToggle();
  }, [isCollapsed, onToggle]);

  if (isCollapsed) {
    return (
      <div
        onClick={handleToggle}
        style={{
          width: 48,
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 16,
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #E0E0E0',
          transition: 'background-color 0.15s ease',
        }}
        title="Expand Field Explorer"
        data-testid="explorer-expand-btn"
      >
        <div
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            backgroundColor: '#F5F5F5',
            fontSize: 16,
            color: '#666',
            transition: 'background-color 0.15s ease',
          }}
        >
          ›
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 12px 10px',
        borderBottom: '1px solid #E0E0E0',
        backgroundColor: '#ffffff',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🗺️</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
          Field Explorer
        </span>
      </div>
      <button
        onClick={handleToggle}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          border: 'none',
          backgroundColor: '#F5F5F5',
          cursor: 'pointer',
          fontSize: 14,
          color: '#666',
          transition: 'background-color 0.15s ease',
        }}
        title="Collapse Field Explorer"
        data-testid="explorer-collapse-btn"
      >
        ‹
      </button>
    </div>
  );
}