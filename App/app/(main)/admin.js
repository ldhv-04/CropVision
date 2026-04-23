import { Redirect } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { AdminLayout } from '../../src/modules/admin/components/AdminLayout';

export default function AdminScreen() {
  const user = useAuthStore((s) => s.user);

  // Route-level role gating
  if (user?.role !== 'admin') {
    return <Redirect href="/inference" />;
  }

  return <AdminLayout />;
}
