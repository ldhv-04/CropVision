/**
 * layoutConfig.js — Configuration-Driven Layout
 *
 * SINGLE SOURCE OF TRUTH for all dashboard layouts.
 * Registered widgets: Nav, Menu, User, Canvas, Stats, Results,
 * Control, Content, Chat, OverviewStats, Map, SensorGrid, AlertsFeed
 *
 * Layout variants:
 *   inference  — Inference / AI analysis page (4-col layout)
 *   dashboard  — Smart farming overview (3-col layout)
 *   admin      — Admin / History pages (3-col layout)
 */

import { NavWidget } from './widgets/NavWidget';
import { MenuWidget } from './widgets/MenuWidget';
import { UserWidget } from './widgets/UserWidget';
import { CanvasWidget } from './widgets/CanvasWidget';
import { StatsWidget } from './widgets/StatsWidget';
import { ResultsWidget } from './widgets/ResultsWidget';
import { ControlWidget } from './widgets/ControlWidget';
import { ContentWidget } from './widgets/ContentWidget';
import { ChatWidget } from './widgets/ChatWidget';
import { OverviewStatsWidget } from './widgets/OverviewStatsWidget';
import { MapWidget } from './widgets/MapWidget';
import { SensorGridWidget } from './widgets/SensorGridWidget';
import { AlertsFeedWidget } from './widgets/AlertsFeedWidget';

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
  OverviewStats: { component: OverviewStatsWidget, title: 'Tổng quan' },
  Map: { component: MapWidget, title: 'Bản đồ cánh đồng' },
  SensorGrid: { component: SensorGridWidget, title: 'Cảm biến IoT' },
  AlertsFeed: { component: AlertsFeedWidget, title: 'Cảnh báo & Hành động' },
};

// ─── Layout Variants ────────────────────────────────────────────────────────

export const LAYOUT_VARIANTS = {

  // ─── Inference page ─────────────────────────────────────────────────
  // 4 columns: sidebar | canvas | stats | chat
  inference: {
    default: {
      columns: '220px 2fr 1fr 320px',
      rows: '64px 1fr 120px',
      areas: [
        ['Nav', 'Canvas', 'Stats', 'Chat'],
        ['Menu', 'Canvas', 'Stats', 'Chat'],
        ['Menu', 'Control', 'Control', 'Chat'],
      ],
    },
    tablet: {
      columns: '180px 2fr 1fr 280px',
      rows: '56px 1fr 100px',
      areas: [
        ['Nav', 'Canvas', 'Stats', 'Chat'],
        ['Menu', 'Canvas', 'Stats', 'Chat'],
        ['Menu', 'Control', 'Control', 'Chat'],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'],
        ['User'],
        ['Canvas'],
        ['Stats'],
        ['Control'],
        ['Chat'],
        ['Menu'],
      ],
    },
  },

  // ─── Dashboard / Smart Farming Overview ─────────────────────────────
  // 3 columns: sidebar(220px) | main area(1fr) | right panel(300px)
  // 4 rows: nav | overview cards | map+sensors | alerts
  dashboard: {
    default: {
      columns: '220px 1fr 300px',
      rows: '64px 140px 1fr 250px',
      areas: [
        ['Nav', '.', 'User'],
        ['Menu', 'OverviewStats', 'OverviewStats'],
        ['Menu', 'Map', 'AlertsFeed'],
        ['Menu', 'SensorGrid', 'AlertsFeed'],
      ],
    },
    tablet: {
      columns: '180px 1fr 260px',
      rows: '56px 130px 1fr 220px',
      areas: [
        ['Nav', '.', 'User'],
        ['Menu', 'OverviewStats', 'OverviewStats'],
        ['Menu', 'Map', 'AlertsFeed'],
        ['Menu', 'SensorGrid', 'AlertsFeed'],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'],
        ['User'],
        ['OverviewStats'],
        ['Map'],
        ['SensorGrid'],
        ['AlertsFeed'],
        ['Menu'],
      ],
    },
  },

  // ─── Admin / History pages ──────────────────────────────────────────
  admin: {
    default: {
      columns: '220px 1fr 280px',
      rows: '64px 1fr',
      areas: [
        ['Nav', '.', 'User'],
        ['Menu', 'Content', 'Content'],
      ],
    },
    tablet: {
      columns: '180px 1fr 240px',
      rows: '56px 1fr',
      areas: [
        ['Nav', '.', 'User'],
        ['Menu', 'Content', 'Content'],
      ],
    },
    mobile: {
      columns: '1fr',
      rows: 'auto',
      areas: [
        ['Nav'],
        ['User'],
        ['Content'],
        ['Menu'],
      ],
    },
  },
};

// ─── Route → Variant Mapping ────────────────────────────────────────────────

export const ROUTE_VARIANT_MAP = [
  { pattern: '/dashboard', variant: 'dashboard' },
  { pattern: '/history', variant: 'admin' },
  { pattern: '/admin', variant: 'admin' },
  // Default → inference
];

export const DEFAULT_VARIANT = 'inference';

// ─── Breakpoint Thresholds (px) ─────────────────────────────────────────────

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};
