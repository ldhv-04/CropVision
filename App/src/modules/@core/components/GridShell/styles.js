/**
 * GridShell Styles — Shared style tokens for all widgets.
 *
 * Used by individual widget components in widgets/ folder
 * and by the GridShell renderer (index.jsx).
 *
 * NOTE: Plain JS objects (not StyleSheet.create) because
 * GridShell renders web-only <div> elements, not React Native <View>.
 */

import { COLORS } from '../../constants/theme';

export const ws = {
  // ─── Layout shells ────────────────────────────────────────────────────
  shell: {
    width: '100vw',
    height: '100vh',
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    padding: 6,
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  surface: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
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
    padding: 16,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  brand: { display: 'flex', flexDirection: 'column', gap: 1 },
  brandName: { color: COLORS.primary, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' },
  brandRole: { color: COLORS.textSecondary, fontSize: 11 },

  // ─── Menu widget ──────────────────────────────────────────────────────
  menuWidget: {
    padding: 12,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  navList: { display: 'flex', flexDirection: 'column', gap: 1 },
  navItem: {
    width: '100%', textAlign: 'left', padding: '10px 12px',
    borderRadius: 8, border: 'none', backgroundColor: 'transparent',
    color: COLORS.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  navItemActive: {
    backgroundColor: `${COLORS.primary}18`,
    color: COLORS.primary,
    fontWeight: 700,
  },
  logoutBtn: {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${COLORS.border}`, backgroundColor: 'transparent',
    color: COLORS.danger, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },

  // ─── Stats / Results widget ───────────────────────────────────────────
  sectionTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: 700 },
  clearBtn: {
    background: 'none', border: 'none',
    color: COLORS.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
  },
};
