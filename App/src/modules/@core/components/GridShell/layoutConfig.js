/**
 * layoutConfig.js — Configuration-Driven Grid Layout (Core Component)
 *
 * Single source of visual layout configurations for web grid shell.
 * Imports directly from feature widget directories, eliminating legacy shims.
 */

import { NavWidget } from './widgets/NavWidget';
import { MenuWidget } from './widgets/MenuWidget';
import { UserWidget } from './widgets/UserWidget';
import { ContentWidget } from './widgets/ContentWidget';

// Agrivision widgets
import { CanvasWidget } from '../../agrivision/widgets/GridShell/CanvasWidget';
import { StatsWidget } from '../../agrivision/widgets/GridShell/StatsWidget';
import { ResultsWidget } from '../../agrivision/widgets/GridShell/ResultsWidget';
import { ControlWidget } from '../../agrivision/widgets/GridShell/ControlWidget';
import { ChatWidget } from '../../agrivision/widgets/GridShell/ChatWidget';
import { MapWidget } from '../../agrivision/widgets/GridShell/MapWidget';
import { EpidemicLedgerWidget } from '../../agrivision/widgets/GridShell/EpidemicLedgerWidget';

// Station widgets
import { OverviewStatsWidget } from '../../station/widgets/GridShell/OverviewStatsWidget';
import { SensorGridWidget } from '../../station/widgets/GridShell/SensorGridWidget';
import { AlertsFeedWidget } from '../../station/widgets/GridShell/AlertsFeedWidget';
import { ScanTrendWidget } from '../../station/widgets/GridShell/ScanTrendWidget';

// ─── Widget Registry ────────────────────────────────────────────────────────

export const WIDGET_REGISTRY = {
  Nav: { component: NavWidget, title: 'Điều hướng' },
  Menu: { component: MenuWidget, title: 'Menu' },
  User: { component: UserWidget, title: 'Người dùng' },
  Canvas: { component: CanvasWidget, title: 'Vùng phát hiện' },
  Stats: { component: StatsWidget, title: 'Thống kê bệnh' },
  Results: { component: ResultsWidget, title: 'Kết quả phát hiện' },
  Control: { component: ControlWidget, title: 'Điều khiển' },
  Content: { component: ContentWidget, title: 'Nội dung' },
  Chat: { component: ChatWidget, title: 'AI Tư vấn' },
  OverviewStats: { component: OverviewStatsWidget, title: 'KPI Tổng quan' },
  Map: { component: MapWidget, title: 'Bản đồ giám sát' },
  ScanTrend: { component: ScanTrendWidget, title: 'Xu hướng quét' },
  SensorGrid: { component: SensorGridWidget, title: 'Cảm biến IoT' },
  AlertsFeed: { component: AlertsFeedWidget, title: 'Cảnh báo' },
  EpidemicLedger: { component: EpidemicLedgerWidget, title: 'Sổ dịch tễ' },
};

// ─── Layout Variants ────────────────────────────────────────────────────────

export const LAYOUT_VARIANTS = {
  inference: {
    default: {
      columns: '220px 1fr 340px 320px',
      rows: '56px 1fr',
      areas: [
        ['Nav',     'Control', 'Control', 'User'],
        ['Menu',    'Canvas',  'Results', 'Chat'],
      ],
    },
    tablet: {
      columns: '1fr 1fr',
      rows: 'auto',
      areas: [
        ['Nav',     'User'],
        ['Control', 'Control'],
        ['Canvas',  'Canvas'],
        ['Results', 'Stats'],
        ['Chat',    'Chat'],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'],
        ['User'],
        ['Control'],
        ['Canvas'],
        ['Results'],
        ['Stats'],
        ['Chat'],
      ],
    },
  },

  dashboard: {
    default: {
      columns: '220px 1fr 340px',
      rows: '56px 1fr',
      areas: [
        ['Nav',     'Control', 'User'],
        ['Menu',    'Content', 'AlertsFeed'],
      ],
    },
    tablet: {
      columns: '1fr 1fr',
      rows: 'auto',
      areas: [
        ['Nav',     'User'],
        ['Control', 'Control'],
        ['Content', 'Content'],
        ['AlertsFeed', 'AlertsFeed'],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'],
        ['User'],
        ['Control'],
        ['Content'],
        ['AlertsFeed'],
      ],
    },
  },

  admin: {
    default: {
      columns: '220px 1fr 340px',
      rows: '56px 1fr',
      areas: [
        ['Nav',  'Control', 'User'],
        ['Menu', 'Content', 'OverviewStats'],
      ],
    },
    tablet: {
      columns: '1fr 1fr',
      rows: 'auto',
      areas: [
        ['Nav',     'User'],
        ['Control', 'Control'],
        ['Content', 'Content'],
        ['OverviewStats', 'OverviewStats'],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'],
        ['User'],
        ['Control'],
        ['Content'],
        ['OverviewStats'],
      ],
    },
  },
};

// ─── Route to Variant Mapping ───────────────────────────────────────────────

export const ROUTE_VARIANT_MAP = [
  { pattern: '/inference', variant: 'inference' },
  { pattern: '/analysis',  variant: 'inference' },
  { pattern: '/admin',      variant: 'admin' },
  { pattern: '/history',    variant: 'admin' },
  { pattern: '/dashboard',  variant: 'dashboard' },
  { pattern: '/fields',     variant: 'dashboard' },
  { pattern: '/alerts',     variant: 'dashboard' },
];

export const DEFAULT_VARIANT = 'dashboard';

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
};
