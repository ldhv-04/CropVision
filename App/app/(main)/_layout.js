import { Slot, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { AppShell } from '../../src/modules/@core/components/AppShell';

// ─── Platform-split shell ─────────────────────────────────────────────────
// Web/Electron  → GridShell (GridStack.js — draggable/resizable widgets)
// Mobile        → AppShell  (Flexbox — unchanged)
//
// GridShell is lazily required to avoid bundling DOM libs on native.
let GridShell = null;
if (Platform.OS === 'web') {
  GridShell = require('../../src/modules/@core/components/GridShell').GridShell;
}

/**
 * Main group layout.
 *
 * On web/Electron: renders the full GridStack dashboard (Phase 1).
 *   Widgets: NavWidget | MenuWidget | UserWidget | CanvasWidget |
 *            StatsWidget | ResultsWidget | ControlWidget
 *
 * On mobile (iOS/Android): renders existing AppShell + <Slot /> unchanged.
 */
export default function MainLayout() {
  const token = useAuthStore((s) => s.token);

  if (!Boolean(token)) {
    return <Redirect href="/welcome" />;
  }

  // ── Web/Electron: GridStack layout ──
  if (Platform.OS === 'web' && GridShell) {
    // GridShell manages its own content via usePathname — no <Slot /> needed
    return <GridShell />;
  }

  // ── Mobile: Flexbox AppShell (unchanged) ──
  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
