import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';

/**
 * Auth group layout.
 * If user is already authenticated, redirect them out of auth flow.
 */
export default function AuthLayout() {
  const token = useAuthStore((s) => s.token);

  if (Boolean(token)) {
    return <Redirect href="/inference" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
