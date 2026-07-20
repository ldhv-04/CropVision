export const STATION_NAV_ITEMS = [
  {
    key: 'dashboard',
    href: '/station',
    label: 'Dashboard',
    icon: '📊',
    title: 'Dashboard',
    subtitle: 'Farm overview & key metrics',
    section: 'primary',
  },
  {
    key: 'fields',
    href: '/station/fields',
    label: 'Field Management',
    icon: '🗺️',
    title: 'Field Management',
    subtitle: 'Interactive map & zone management',
    section: 'primary',
  },
  {
    key: 'sensors',
    href: '/station/sensors',
    label: 'IoT Sensors',
    icon: '📡',
    title: 'IoT Sensors',
    subtitle: 'Real-time environmental monitoring',
    section: 'primary',
  },
  {
    key: 'microbiome',
    href: '/station/microbiome',
    label: 'Microbiome Analytics',
    icon: '🔬',
    title: 'Microbiome Analytics',
    subtitle: 'Soil health & biological diversity',
    section: 'primary',
  },
  {
    key: 'recommendations',
    href: '/station/recommendations',
    label: 'Recommendations',
    icon: '💡',
    title: 'Recommendations',
    subtitle: 'AI-powered farming insights',
    section: 'intelligence',
  },
  {
    key: 'interventions',
    href: '/station/interventions',
    label: 'Interventions',
    icon: '🔧',
    title: 'Interventions',
    subtitle: 'Action log & task tracking',
    section: 'intelligence',
  },
  {
    key: 'reports',
    href: '/station/reports',
    label: 'Reports',
    icon: '📄',
    title: 'Reports',
    subtitle: 'Data export & analysis reports',
    section: 'intelligence',
  },
  {
    key: 'settings',
    href: '/station/settings',
    label: 'Settings',
    icon: '⚙️',
    title: 'Settings',
    subtitle: 'Account & application preferences',
    section: 'bottom',
  },
  {
    key: 'system',
    href: '/station/system',
    label: 'System',
    icon: '🛡️',
    title: 'System Administration',
    subtitle: 'Users, samples & system operations',
    section: 'admin',
    visibility: 'hidden',
    legacyAlias: '/system',
  },
  {
    key: 'alerts',
    href: '/station/alerts',
    label: 'Alerts',
    icon: '🚨',
    title: 'Alert Management',
    subtitle: 'Review and manage disease alerts',
    section: 'admin',
    visibility: 'hidden',
    legacyAlias: '/alerts',
  },
];

function normalizeStationPath(pathname = '/') {
  const path = String(pathname)
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/\(station\)(?=\/|$)/, '')
    .replace(/^\/station(?=\/|$)/, '')
    .replace(/\/+$/, '');

  return path || '/';
}

export function getStationNavItemByHref(pathname) {
  const normalizedPath = normalizeStationPath(pathname);

  return STATION_NAV_ITEMS.find(
    (item) => normalizeStationPath(item.href) === normalizedPath,
  ) ?? null;
}

export function getStationNavItemByKey(key) {
  return STATION_NAV_ITEMS.find((item) => item.key === key) ?? null;
}

export function getStationRouteMeta(pathname) {
  return getStationNavItemByHref(pathname) ?? getStationNavItemByKey('dashboard');
}
