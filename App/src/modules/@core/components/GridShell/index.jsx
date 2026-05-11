/**
 * GridShell — Configuration-Driven CSS Grid Layout
 *
 * Pure renderer: reads layout config → renders CSS Grid.
 * Zero layout logic — all configuration lives in layoutConfig.js.
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
import { ws } from './styles';

export function GridShell() {
  const { layout, widgets } = useLayoutConfig();

  // Convert areas[][] → CSS grid-template-areas string
  const templateAreas = useMemo(
    () => layout.areas.map((row) => `"${row.join(' ')}"`).join(' '),
    [layout.areas],
  );

  const gridStyle = useMemo(
    () => ({
      ...ws.shell,
      display: 'grid',
      // columns/rows are now CSS value strings (e.g. '220px 2fr 1fr')
      // — used directly, no repeat() wrapper needed
      gridTemplateColumns: layout.columns,
      gridTemplateRows: layout.rows === 'auto' ? 'auto' : layout.rows,
      gridTemplateAreas: templateAreas,
      gap: '6px',
      // Ensure grid items can shrink below content size
      alignItems: 'stretch',
    }),
    [layout, templateAreas],
  );

  return (
    <div style={gridStyle}>
      {widgets.map(({ name, component: Widget }) => (
        <div key={name} style={{ ...ws.surface, gridArea: name }}>
          <Widget />
        </div>
      ))}
    </div>
  );
}

export default GridShell;
