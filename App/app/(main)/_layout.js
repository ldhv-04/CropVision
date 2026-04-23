import { Slot, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { AppShell } from '../../src/modules/@core/components/AppShell';

/**
 * Main group layout — authenticated shell with persistent sidebar/topbar.
 * Uses <Slot /> so AppShell wraps ALL child routes without unmounting.
 */
export default function MainLayout() {
  const token = useAuthStore((s) => s.token);

  if (!Boolean(token)) {
    return <Redirect href="/welcome" />;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
