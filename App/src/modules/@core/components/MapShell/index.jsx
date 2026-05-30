/**
 * MapShell — Map-Centric Layout Shell
 *
 * Full-screen map background with floating UI elements on top.
 * Used for the Station App redesign (Epoch 1 & 3).
 */

import { useMemo } from 'react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../auth/useAuthStore';
import { NavWidget } from '../GridShell/widgets/NavWidget';
import { MapWidget } from '../GridShell/widgets/MapWidget';

import { MapSidebar } from '../MapSidebar';
import { MapDetailDrawer } from '../MapDetailDrawer';
import { TimelineScrubber } from '../TimelineScrubber';

// Define standard z-index layers per Task 1.2
const Z_INDEX = {
  BASE_MAP: 0,
  MAP_CONTROLS: 10,
  FLOATING_NAV: 20,
  OVERLAYS_DRAWERS: 30,
};

function MapShellInner() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const containerStyle = {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: colors.background,
    fontFamily: '"Inter", "Outfit", system-ui, -apple-system, sans-serif',
  };

  const mapLayerStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: Z_INDEX.BASE_MAP,
  };

  const floatingNavStyle = {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 64,
    zIndex: Z_INDEX.FLOATING_NAV,
    backgroundColor: colors.surface,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    boxShadow: SHADOWS.card,
    overflow: 'hidden',
  };

  const floatingSidebarStyle = {
    position: 'absolute',
    top: 96,
    left: 16,
    bottom: 16,
    width: 260,
    zIndex: Z_INDEX.OVERLAYS_DRAWERS,
    backgroundColor: colors.surface,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    boxShadow: SHADOWS.card,
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle} data-testid="station-dashboard-map-shell">
      {/* Base Map Layer */}
      <div style={mapLayerStyle}>
        <MapWidget />
      </div>

      {/* Floating Top Nav */}
      <div style={floatingNavStyle}>
        <NavWidget />
      </div>

      {/* Floating Sidebar Menu */}
      <div style={floatingSidebarStyle}>
        <MapSidebar />
      </div>

      {/* Map Detail Drawer */}
      <MapDetailDrawer />

      {/* Timeline Scrubber */}
      <TimelineScrubber />
    </div>
  );
}

export function MapShell() {
  return (
    <ThemeProvider>
      <MapShellInner />
    </ThemeProvider>
  );
}

export default MapShell;
