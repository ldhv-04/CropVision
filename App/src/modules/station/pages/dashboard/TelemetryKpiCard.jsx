/**
 * TelemetryKpiCard — Tactical Metric Display Card.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

export function TelemetryKpiCard({ icon, code, label, value, subValue, color }) {
  const accentColor = color || TACTICAL_THEME.radar;

  return (
    <div
      style={{
        flex: '1 1 210px',
        minWidth: 200,
        padding: '18px 20px',
        borderRadius: 8,
        backgroundColor: TACTICAL_THEME.bgPanel,
        border: `1px solid ${TACTICAL_THEME.border}`,
        boxShadow: TACTICAL_THEME.shadowPanel,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: accentColor,
              fontFamily: TACTICAL_THEME.fontMono,
              letterSpacing: '1px',
              backgroundColor: `${accentColor}15`,
              padding: '2px 5px',
              borderRadius: 3,
            }}
          >
            {code}
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: TACTICAL_THEME.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: TACTICAL_THEME.fontMono,
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: accentColor,
          fontFamily: TACTICAL_THEME.fontMono,
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {subValue && (
        <div
          style={{
            fontSize: 10.5,
            color: TACTICAL_THEME.textSecondary,
            fontFamily: TACTICAL_THEME.fontMono,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ color: TACTICAL_THEME.textMuted }}>STATUS:</span>
          <span>{subValue}</span>
        </div>
      )}
    </div>
  );
}
