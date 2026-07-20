/**
 * Legacy GridShell content registry.
 *
 * This is intentionally a compatibility map. It lets the shared GridShell keep
 * serving old route aliases while owner-specific Station/Agrivision shells are
 * still being separated.
 */

import { AdminLayout } from '../../../admin/components/AdminLayout';
import SampleList from '../../../history/components/SampleList';
import AlertsAdminScreen from '../../../admin/components/AlertsAdminScreen';
import MobileFieldsScreen from '../../../agrivision/screens/MobileFieldsScreen';
import StationSystem from '../../../station/pages/SystemPage';

export const COMPAT_CONTENT_REGISTRY = {
  // Agrivision-owned field list rendered through legacy `/fields`.
  fields: {
    owner: 'agrivision',
    component: MobileFieldsScreen,
    getProps: () => ({}),
  },

  // Station-owned system page rendered through legacy `/system`.
  system: {
    owner: 'station',
    component: StationSystem,
    getProps: () => ({}),
  },

  // Legacy sample-history surface. Keep until owner-specific history is settled.
  history: {
    owner: 'legacy',
    component: SampleList,
    getProps: ({ token, user }) => ({
      authToken: token,
      currentUser: user,
    }),
  },

  // Station/admin compatibility surfaces.
  admin: {
    owner: 'station',
    component: AdminLayout,
    getProps: () => ({}),
  },
  alerts: {
    owner: 'station',
    component: AlertsAdminScreen,
    getProps: () => ({}),
  },
};

export function getCompatContentBranch(route) {
  return COMPAT_CONTENT_REGISTRY[route] ?? null;
}
