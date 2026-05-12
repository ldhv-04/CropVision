1/**
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
import { ChatWidget }    from './widgets/ChatWidget';

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
  Chat:     { component: ChatWidget,    title: 'AI Tư vấn' },
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
  // 4 columns: sidebar(220px) | canvas(1fr) | chat(320px) | user(64px)
  // 3 rows:    nav(64px) | main(1fr) | bottom(120px)
  inference: {
    default: {
      columns: '220px 1fr 320px',
      rows: '64px 1fr 120px',
      areas: [
        ['Nav',     'Canvas',  'Chat'   ],
        ['Menu',    'Canvas',  'Chat'   ],
        ['Menu',    'Control', 'Chat'   ],
      ],
    },
    tablet: {
      columns: '180px 1fr 280px',
      rows: '56px 1fr 100px',
      areas: [
        ['Nav',     'Canvas',  'Chat'   ],
        ['Menu',    'Canvas',  'Chat'   ],
        ['Menu',    'Control', 'Chat'   ],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'     ],
        ['User'    ],
        ['Canvas'  ],
        ['Control' ],
        ['Chat'    ],
        ['Menu'    ],
      ],
    },
  },

  // ─── Admin / History pages ──────────────────────────────────────────────
  // 3 columns: sidebar(220px) | content(1fr) | user(280px)
  // 2 rows:    nav(64px) | main(1fr)
  admin: {
    default: {
      // 3 columns: sidebar(220px) | content(1fr) | user(280px)
      columns: '220px 1fr 280px',
      rows: '64px 1fr',
      areas: [
        ['Nav',    '.',       'User'   ],
        ['Menu',   'Content', 'Content'],
      ],
    },
    tablet: {
      columns: '180px 1fr 240px',
      rows: '56px 1fr',
      areas: [
        ['Nav',    '.',       'User'   ],
        ['Menu',   'Content', 'Content'],
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
