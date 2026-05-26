/**
 * GridShell Styles — Shared style tokens for all widgets.
 *
 * NOTE: Plain JS objects (not StyleSheet.create) because
 * GridShell renders web-only <div> elements, not React Native <View>.
 *
 * Dynamic colors (dark/light mode) must be resolved in each widget
 * via useTheme() — these static tokens use DARK_COLORS as defaults
 * for snapshot stability.
 *
 * Premium SoilzePro aesthetic:
 *   - 16px rounded card corners
 *   - Box shadows for depth
 *   - Inter / system-ui font stack
 *   - Forest-green border accents
 */

import { DARK_COLORS as C, SHADOWS } from '../../constants/theme';

export const ws = {
  // ─── Layout shells ────────────────────────────────────────────────────
  shell: {
    width: '100vw',
    height: '100vh',
    backgroundColor: C.background,
    overflow: 'hidden',
    padding: 6,
    boxSizing: 'border-box',
    fontFamily: '"Inter", "Outfit", system-ui, -apple-system, sans-serif',
  },
  surface: {
    backgroundColor: C.surface,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    boxShadow: SHADOWS.card,
    overflow: 'hidden',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    transition: 'box-shadow 0.2s ease',
  },
  fill: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  pad: {
    padding: 14,
    height: '100%',
    boxSizing: 'border-box',
  },

  // ─── Nav / Brand widget ───────────────────────────────────────────────
  navWidget: {
    padding: '12px 16px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxSizing: 'border-box',
    background: C.gradientPrimary,
  },
  brand: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { fontSize: 22, lineHeight: 1 },
  brandText: { display: 'flex', flexDirection: 'column', gap: 1 },
  brandName: { color: '#ffffff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' },
  brandRole: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },

  // ─── Menu widget ──────────────────────────────────────────────────────
  menuWidget: {
    padding: 12,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  menuSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  menuSectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: '8px 12px 4px',
  },
  navList: { display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    width: '100%', textAlign: 'left', padding: '9px 12px',
    borderRadius: 10, border: 'none', backgroundColor: 'transparent',
    color: C.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 9,
    transition: 'background-color 0.15s, color 0.15s',
  },
  navItemActive: {
    backgroundColor: `${C.primary}28`,
    color: C.primaryGlow,
    fontWeight: 700,
  },
  navItemIcon: { fontSize: 15, width: 18, textAlign: 'center' },
  logoutBtn: {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: `1px solid ${C.dangerBorder}`, backgroundColor: `${C.danger}12`,
    color: C.danger, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'background-color 0.15s',
  },

  // ─── Stats / Results widget ───────────────────────────────────────────
  sectionTitle: { color: C.textPrimary, fontSize: 14, fontWeight: 700 },
  sectionSubtitle: { color: C.textSecondary, fontSize: 12 },
  clearBtn: {
    background: 'none', border: 'none',
    color: C.primaryGlow, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
  },

  // ─── KPI Card ─────────────────────────────────────────────────────────
  kpiCard: {
    padding: '14px 16px',
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    backgroundColor: C.surfaceAlt,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    boxShadow: SHADOWS.card,
    transition: 'box-shadow 0.2s, transform 0.15s',
  },
  kpiIcon: { fontSize: 22 },
  kpiValue: { fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: C.textPrimary },
  kpiLabel: { fontSize: 12, color: C.textSecondary, fontWeight: 500 },
  kpiTrend: { fontSize: 11, fontWeight: 600 },
};
