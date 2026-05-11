/**
 * ContentWidget — Full-width content area for History / Admin routes
 * Uses useSegments() for exact route matching.
 */

import { useSegments } from 'expo-router';
import { useAuthStore } from '../../../auth/useAuthStore';
import { AdminLayout } from '../../../../admin/components/AdminLayout';
import SampleList from '../../../../history/components/SampleList';
import { ws } from '../styles';

export function ContentWidget() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const route = segments[segments.length - 1] ?? '';

  if (route === 'history') {
    return <div style={ws.fill}><SampleList authToken={token} currentUser={user} /></div>;
  }
  if (route === 'admin') {
    return <div style={ws.fill}><AdminLayout /></div>;
  }
  return null;
}
