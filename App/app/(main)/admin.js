import { Redirect } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';

export default function AdminScreen() {
  const user = useAuthStore((s) => s.user);

  return <Redirect href={user?.role === 'admin' ? '/(station)' : '/(agrivision)'} />;
}
