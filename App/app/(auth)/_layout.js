import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';

/**
 * Auth group layout.
 * If user is already authenticated, redirect them out of auth flow.
 */
export default function AuthLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (Boolean(token)) {
    if (user?.role === 'admin') {
      return <Redirect href="/(station)" />;
    } else {
      return <Redirect href="/(agrivision)" />;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
