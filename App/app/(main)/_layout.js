import { Slot, Redirect, usePathname } from 'expo-router';
import { Platform } from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { AppShell } from '../../src/modules/@core/components/AppShell';

// ─── Platform-split shell ─────────────────────────────────────────────────
// Web/Electron  → compatibility GridShell
// Mobile        → AppShell  (Flexbox — unchanged)
//
// GridShell is lazily required to avoid bundling DOM libs on native.
let GridShell = null;
if (Platform.OS === 'web') {
  GridShell = require('../../src/modules/@core/components/GridShell').GridShell;
}

/**
 * Legacy Main group layout.
 *
 * Current product ownership is split between:
 * - Station/Admin: `/(station)`
 * - Agrivision/User: `/(agrivision)`
 *
 * Keep this route group as a compatibility surface until legacy URLs and tests
 * are migrated. New feature work should not target `/(main)`.
 *
 * On web/Electron: renders compatibility GridShell. Owner routes should use
 * `StationShell` or `AgrivisionShell` instead.
 *
 * On mobile (iOS/Android): renders existing AppShell + <Slot /> unchanged.
 */
export default function MainLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  if (!Boolean(token)) {
    return <Redirect href="/welcome" />;
  }

  if (pathname.includes('/analysis')) {
    return <Redirect href="/(agrivision)/inference" />;
  }

  if (pathname.includes('/admin') || pathname.includes('/dashboard')) {
    return <Redirect href={user?.role === 'admin' ? '/(station)' : '/(agrivision)'} />;
  }

  if ((pathname.includes('/alerts') || pathname.includes('/system')) && user?.role !== 'admin') {
    return <Redirect href="/(agrivision)" />;
  }

  // ── Web/Electron: compatibility GridShell layout ──
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
