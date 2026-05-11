/**
 * GridShell Layout Configuration — Configuration-Driven Layout
 *
 * SINGLE SOURCE OF TRUTH for all dashboard layouts.
 *
 * To add a new widget:
 *   1. Create component in widgets/ folder
 *   2. Add entry to WIDGET_REGISTRY below
 *   3. Place it in the grid areas of the desired variant
 *
 * No JSX or CSS changes needed — layout is data, not code.
 *
 * Responsive breakpoints:
 *   default  >= 1024px  (desktop)
 *   tablet   768–1023px (tablet / small laptop)
 *   mobile   < 768px    (phone)
 *
 * Grid areas use CSS Grid Template Areas syntax.
 * Each inner array = one row. Each string = one cell.
 * Repeating a name makes that area span multiple cells.
 *
 * columns / rows: CSS value strings (e.g. '220px 2fr 1fr', '64px 1fr 1fr 180px').
 *   — The number of space-separated tokens MUST match the number of cells per row in areas.
 *   — Use 'auto' for rows to let content determine height.
 */

import { NavWidget }     from './widgets/NavWidget';
import { MenuWidget }    from './widgets/MenuWidget';
import { UserWidget }    from './widgets/UserWidget';
import { CanvasWidget }  from './widgets/CanvasWidget';
import { StatsWidget }   from './widgets/StatsWidget';
import { ResultsWidget } from './widgets/ResultsWidget';
import { ControlWidget } from './widgets/ControlWidget';
import { ContentWidget } from './widgets/ContentWidget';

// ─── Widget Registry ────────────────────────────────────────────────────────
// Name → { component, title }
// The name MUST match the string used in grid areas below.

export const WIDGET_REGISTRY = {
  Nav:      { component: NavWidget,     title: 'Điều hướng' },
  Menu:     { component: MenuWidget,    title: 'Menu' },
  User:     { component: UserWidget,    title: 'Người dùng' },
  Canvas:   { component: CanvasWidget,  title: 'Vùng phát hiện' },
  Stats:    { component: StatsWidget,   title: 'Thống kê bệnh' },
  Results:  { component: ResultsWidget, title: 'Kết quả phát hiện' },
  Control:  { component: ControlWidget, title: 'Điều khiển' },
  Content:  { component: ContentWidget, title: 'Nội dung' },
};

// ─── Layout Variants ────────────────────────────────────────────────────────
// Each variant defines layouts for all breakpoints.
// Fallback chain: requested breakpoint → tablet → default.
//
// columns: CSS grid-template-columns string. Token count = columns per row in areas.
// rows:    CSS grid-template-areas row count must match areas.length.
//          Use 'auto' to let content drive height.

export const LAYOUT_VARIANTS = {

  // ─── Inference page ─────────────────────────────────────────────────────
  inference: {
    default: {
      // 4 columns: sidebar(220px) | canvas(2fr) | canvas(2fr) | right-panel(1fr)
      columns: '220px 2fr 2fr 1fr',
      // 4 rows: nav(64px) | main(1fr) | main(1fr) | bottom(180px)
      rows: '64px 1fr 1fr 180px',
      areas: [
        ['Nav',    'Canvas',  'Canvas',  'User'   ],
        ['Menu',   'Canvas',  'Canvas',  'Stats'  ],
        ['Menu',   'Canvas',  'Canvas',  'Results'],
        ['Menu',   'Control', 'Control', 'Results'],
      ],
    },
    tablet: {
      // 4 columns: narrower sidebar(180px) | canvas(2fr) | canvas(2fr) | right(1fr)
      columns: '180px 2fr 2fr 1fr',
      rows: '56px 1fr 1fr 160px',
      areas: [
        ['Nav',    'Canvas',  'Canvas',  'User'   ],
        ['Menu',   'Canvas',  'Canvas',  'Stats'  ],
        ['Menu',   'Canvas',  'Canvas',  'Results'],
        ['Menu',   'Control', 'Control', 'Control'],
      ],
    },
    mobile: {
      // 1 column: full-width stack
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'     ],
        ['User'    ],
        ['Canvas'  ],
        ['Control' ],
        ['Stats'   ],
        ['Results' ],
        ['Menu'    ],
      ],
    },
  },

  // ─── Admin / History pages ──────────────────────────────────────────────
  // 4 columns: sidebar(220px) | content(2fr) | content(2fr) | user(1fr)
  // 4 rows:    nav(64px) | main(1fr) | main(1fr) | main(1fr)
  admin: {
    default: {
      // Match inference structure: 4 columns, 4 rows
      columns: '220px 2fr 2fr 1fr',
      rows: '64px 1fr 1fr 1fr',
      areas: [
        ['Nav',  'Content', 'Content', 'User'   ],
        ['Menu', 'Content', 'Content', 'Content'],
        ['Menu', 'Content', 'Content', 'Content'],
        ['Menu', 'Content', 'Content', 'Content'],
      ],
    },
    tablet: {
      columns: '180px 2fr 2fr 1fr',
      rows: '56px 1fr 1fr 1fr',
      areas: [
        ['Nav',  'Content', 'Content', 'User'   ],
        ['Menu', 'Content', 'Content', 'Content'],
        ['Menu', 'Content', 'Content', 'Content'],
        ['Menu', 'Content', 'Content', 'Content'],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'    ],
        ['User'   ],
        ['Content'],
        ['Menu'   ],
      ],
    },
  },
};

// ─── Route → Variant Mapping ────────────────────────────────────────────────
// First match wins. The default fallback is 'inference'.

export const ROUTE_VARIANT_MAP = [
  { pattern: '/history', variant: 'admin' },
  { pattern: '/admin',   variant: 'admin' },
  // Everything else → inference
];

export const DEFAULT_VARIANT = 'inference';

// ─── Breakpoint Thresholds (px) ─────────────────────────────────────────────

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};
