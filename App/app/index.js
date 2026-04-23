import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/modules/@core/auth/useAuthStore';

/**
 * Root index route.
 * Redirects to the appropriate section based on auth state.
 * - Authenticated → (main)/inference
 * - Unauthenticated → (auth)/welcome
 */
export default function Index() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = Boolean(token);

  if (isAuthenticated) {
    return <Redirect href="/inference" />;
  }

  return <Redirect href="/welcome" />;
}
