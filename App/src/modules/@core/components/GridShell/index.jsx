/**
 * GridShell — Compatibility CSS Grid Layout
 *
 * Compatibility-heavy renderer: reads layout config → renders CSS Grid.
 * Wrapped in ThemeProvider so all child widgets can call useTheme().
 * Owner widgets now live under Station/Agrivision modules, but this shell still
 * keeps legacy layout, menu, content, and route-alias compatibility. New route
 * entry points should prefer owner shell adapters:
 * - src/modules/station/shell/StationShell.jsx
 * - src/modules/agrivision/shell/AgrivisionShell.jsx
 *
 * To add a new widget:
 *   1. Create component in widgets/ folder
 *   2. Add entry to WIDGET_REGISTRY in layoutConfig.js
 *   3. Place it in grid areas of the desired variant
 *
 * No changes to this file needed for widget/layout changes.
 */

import { useMemo } from 'react';
import { useLayoutConfig } from './hooks/useLayoutConfig';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../auth/useAuthStore';

/** Inner shell: reads theme then renders the grid */
function GridShellInner() {
  const { layout, widgets, variantName } = useLayoutConfig();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const testId = useMemo(() => {
    if (variantName === 'inference') return 'inference-screen';
    if (variantName === 'dashboard') {
      return user?.role === 'admin' ? 'station-dashboard' : 'agrivision-home';
    }
    return undefined;
  }, [variantName, user?.role]);

  const templateAreas = useMemo(
    () => layout.areas.map((row) => `"${row.join(' ')}"`).join(' '),
    [layout.areas],
  );

  const gridStyle = useMemo(
    () => ({
      width: '100vw',
      minHeight: '100vh',
      height: layout.rows === 'auto' ? 'auto' : '100vh',
      overflowY: layout.rows === 'auto' ? 'auto' : 'hidden',
      display: 'grid',
      gridTemplateColumns: layout.columns,
      gridTemplateRows: layout.rows === 'auto' ? 'auto' : layout.rows,
      gridTemplateAreas: templateAreas,
      gap: '6px',
      padding: 6,
      boxSizing: 'border-box',
      alignItems: 'stretch',
      backgroundColor: colors.background,
      fontFamily: '"Inter", "Outfit", system-ui, -apple-system, sans-serif',
      transition: 'background-color 0.3s ease',
    }),
    [layout, templateAreas, colors.background],
  );

  const surfaceStyle = (name) => ({
    backgroundColor: colors.surface,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    boxShadow: SHADOWS.card,
    overflow: 'hidden',
    height: '100%',
    minHeight: layout.rows === 'auto' ? (name === 'Nav' || name === 'User' || name === 'Menu' ? 'auto' : 320) : 0,
    boxSizing: 'border-box',
    gridArea: name,
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  });

  return (
    <div style={gridStyle} data-testid={testId}>
      {widgets.map(({ name, component: Widget }) => (
        <div key={name} style={surfaceStyle(name)}>
          <Widget />
        </div>
      ))}
    </div>
  );
}

/** Public entry point — wraps entire shell in ThemeProvider */
export function GridShell() {
  return (
    <ThemeProvider>
      <GridShellInner />
    </ThemeProvider>
  );
}

export default GridShell;
