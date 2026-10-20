/**
 * TacticalPanel — High-density dashboard telemetry panel wrapper.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

export function TacticalPanel({ title, subtitle, icon, children, badge }) {
  return (
    <div
      style={{
        flex: '1 1 420px',
        padding: '20px',
        borderRadius: 8,
        backgroundColor: TACTICAL_THEME.bgPanel,
        border: `1px solid ${TACTICAL_THEME.border}`,
        boxShadow: TACTICAL_THEME.shadowPanel,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 800,
                color: TACTICAL_THEME.textPrimary,
                fontFamily: TACTICAL_THEME.fontMono,
              }}
            >
              {title}
            </h4>
            {subtitle && (
              <p
                style={{
                  margin: 0,
                  fontSize: 10.5,
                  color: TACTICAL_THEME.textMuted,
                  fontFamily: TACTICAL_THEME.fontMono,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: `${TACTICAL_THEME.radar}15`,
              color: TACTICAL_THEME.radar,
              fontFamily: TACTICAL_THEME.fontMono,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
