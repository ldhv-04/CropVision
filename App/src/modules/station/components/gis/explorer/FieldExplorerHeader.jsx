/**
 * FieldExplorerHeader — Tactical Cadastral Explorer Header
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useCallback } from 'react';
import { TACTICAL_THEME } from '../../../constants/tacticalTheme';

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
          width: 44,
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 16,
          cursor: 'pointer',
          backgroundColor: TACTICAL_THEME.bgPanelSolid,
          borderRight: `1px solid ${TACTICAL_THEME.border}`,
          transition: 'background-color 0.15s ease',
        }}
        title="Expand Field Explorer"
        data-testid="explorer-expand-btn"
      >
        <div
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${TACTICAL_THEME.border}`,
            fontSize: 14,
            color: TACTICAL_THEME.radar,
            fontFamily: TACTICAL_THEME.fontMono,
            fontWeight: 800,
            transition: 'all 0.15s ease',
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
        padding: '12px 14px',
        borderBottom: `1px solid ${TACTICAL_THEME.border}`,
        backgroundColor: TACTICAL_THEME.bgPanelSolid,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, filter: 'drop-shadow(0 0 6px rgba(0, 210, 255, 0.5))' }}>🗺️</span>
        <div>
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            color: TACTICAL_THEME.textPrimary,
            fontFamily: TACTICAL_THEME.fontMono,
            letterSpacing: '0.8px',
          }}>
            CADASTRAL EXPLORER
          </span>
        </div>
      </div>
      <button
        onClick={handleToggle}
        style={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          border: `1px solid ${TACTICAL_THEME.border}`,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          cursor: 'pointer',
          fontSize: 12,
          color: TACTICAL_THEME.textSecondary,
          fontFamily: TACTICAL_THEME.fontMono,
          fontWeight: 800,
          transition: 'all 0.15s ease',
        }}
        title="Collapse Field Explorer"
        data-testid="explorer-collapse-btn"
      >
        ‹
      </button>
    </div>
  );
}
