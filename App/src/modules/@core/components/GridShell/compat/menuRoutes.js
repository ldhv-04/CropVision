/**
 * Legacy GridShell menu routes.
 *
 * Keep route strings stable here while old aliases and owner-specific routes
 * coexist. This file is data only; MenuWidget owns rendering.
 */

export const COMPAT_MENU_ROUTES = {
  agrivisionHome: '/(agrivision)',
  agrivisionInference: '/(agrivision)/inference',
  legacyFields: '/fields',
  legacyHistory: '/history',
  legacyAlerts: '/alerts',
  legacySystem: '/system',
};

export const COMPAT_MENU_SECTIONS = [
  {
    label: 'Phân tích',
    items: [
      {
        label: 'Tổng quan',
        href: COMPAT_MENU_ROUTES.agrivisionHome,
        key: 'dashboard',
        icon: '📊',
        owner: 'agrivision',
      },
      {
        label: 'Phân tích ảnh',
        href: COMPAT_MENU_ROUTES.agrivisionInference,
        key: 'analysis',
        icon: '🔬',
        owner: 'agrivision',
      },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      {
        label: 'Cánh đồng',
        href: COMPAT_MENU_ROUTES.legacyFields,
        key: 'fields',
        icon: '🌾',
        owner: 'legacy-agrivision',
      },
      {
        label: 'Lịch sử mẫu',
        href: COMPAT_MENU_ROUTES.legacyHistory,
        key: 'history',
        icon: '📋',
        owner: 'legacy',
      },
      {
        label: 'Cảnh báo',
        href: COMPAT_MENU_ROUTES.legacyAlerts,
        key: 'alerts',
        icon: '🚨',
        adminOnly: true,
        owner: 'legacy-station',
      },
      {
        label: 'Quản trị',
        href: COMPAT_MENU_ROUTES.legacySystem,
        key: 'system',
        icon: '⚙️',
        adminOnly: true,
        owner: 'legacy-station',
      },
    ],
  },
];
