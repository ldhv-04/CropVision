/**
 * Station Command Shell — Main Application Layout
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * - Left Tactical Command Rail (260px)
 * - Top Telemetry HUD Header (60px)
 * - Main Operational Canvas
 */

import React from 'react';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

export function SoilzeProShell({ children }) {
  const user = useAuthStore((s) => s.user);

  const shellStyle = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: TACTICAL_THEME.bgBase,
    backgroundImage: `
      radial-gradient(circle at 15% 15%, rgba(0, 245, 160, 0.03) 0%, transparent 40%),
      radial-gradient(circle at 85% 85%, rgba(0, 210, 255, 0.02) 0%, transparent 40%),
      linear-gradient(rgba(27, 37, 55, 0.25) 1px, transparent 1px),
      linear-gradient(90deg, rgba(27, 37, 55, 0.25) 1px, transparent 1px)
    `,
    backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px',
    color: TACTICAL_THEME.textPrimary,
    fontFamily: TACTICAL_THEME.fontFamily,
  };

  const mainAreaStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: 0,
    minHeight: 0,
  };

  return (
    <div style={shellStyle} data-testid="station-command-shell">
      {/* Left Tactical Command Rail */}
      <Sidebar />

      {/* Main Mission Control Area */}
      <div style={mainAreaStyle}>
        <TopHeader />
        <div style={contentStyle} data-testid="station-command-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default SoilzeProShell;
