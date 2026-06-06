/**
 * ContentWidget — legacy compatibility content area for History / Admin routes
 * Uses useSegments() for exact route matching.
 * Owner-specific imports here are migration debt; keep behavior stable until
 * GridShell is split into owner-specific shells.
 */

import { useSegments } from 'expo-router';
import { useAuthStore } from '../../../auth/useAuthStore';
import { AdminLayout } from '../../../../admin/components/AdminLayout';
import SampleList from '../../../../history/components/SampleList';
import AlertsAdminScreen from '../../../../admin/components/AlertsAdminScreen';
import MobileFieldsScreen from '../../../../agrivision/screens/MobileFieldsScreen';
import StationSystem from '../../../../station/pages/SystemPage';
import { ws } from '../styles';

export function ContentWidget() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const route = segments[segments.length - 1] ?? '';

  if (route === 'fields') {
    return <div style={ws.fill}><MobileFieldsScreen /></div>;
  }
  if (route === 'system') {
    return <div style={ws.fill}><StationSystem /></div>;
  }
  if (route === 'history') {
    return <div style={ws.fill}><SampleList authToken={token} currentUser={user} /></div>;
  }
  if (route === 'admin') {
    return <div style={ws.fill}><AdminLayout /></div>;
  }
  if (route === 'alerts') {
    return <div style={ws.fill}><AlertsAdminScreen /></div>;
  }
  return null;
}
