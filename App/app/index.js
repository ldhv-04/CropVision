import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/modules/@core/auth/useAuthStore';

/**
 * Root index route.
 * Redirects to the appropriate section based on auth state.
 * - Authenticated farmer → (agrivision)
 * - Authenticated admin → (station)
 * - Unauthenticated → (auth)/welcome
 */
export default function Index() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(token);

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Redirect href="/(station)" />;
    } else {
      return <Redirect href="/(agrivision)" />;
    }
  }

  return <Redirect href="/welcome" />;
}
