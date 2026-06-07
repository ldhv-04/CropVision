/**
 * CropVision Station Layout — SoilzePro-Based UI
 *
 * Replaces the legacy MapShell layout with SoilzePro's
 * navigation architecture: sidebar + header + content area.
 *
 * Source of truth: soilzepro-research/*
 * Legacy backup: App/app/(station-legacy)/
 */

import { useEffect, useState } from 'react';
import { Redirect, usePathname } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { ThemeProvider } from '../../src/modules/@core/context/ThemeContext';
import { DARK_COLORS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

// Layout components
import { SoilzeProShell } from '../../src/modules/station/layout/SoilzeProShell';

// Pages
import DashboardPage from '../../src/modules/station/pages/DashboardPage';
import FieldsPage from '../../src/modules/station/pages/FieldsPage';
import SensorsPage from '../../src/modules/station/pages/SensorsPage';
import MicrobiomePage from '../../src/modules/station/pages/MicrobiomePage';
import RecommendationsPage from '../../src/modules/station/pages/RecommendationsPage';
import InterventionsPage from '../../src/modules/station/pages/InterventionsPage';
import ReportsPage from '../../src/modules/station/pages/ReportsPage';
import SettingsPage from '../../src/modules/station/pages/SettingsPage';
import SystemPage from '../../src/modules/station/pages/SystemPage';

const PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  fields: FieldsPage,
  sensors: SensorsPage,
  microbiome: MicrobiomePage,
  recommendations: RecommendationsPage,
  interventions: InterventionsPage,
  reports: ReportsPage,
  settings: SettingsPage,
  system: SystemPage,
};

function getRouteFromPathname(pathname = '') {
  if (pathname.includes('/system')) return 'system';
  return null;
}

function StationContent() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const routeFromPath = getRouteFromPathname(pathname);
  const [activeRoute, setActiveRoute] = useState(routeFromPath ?? 'dashboard');

  useEffect(() => {
    if (routeFromPath) {
      setActiveRoute(routeFromPath);
    }
  }, [routeFromPath]);

  if (!token) return <Redirect href="/welcome" />;
  if (user?.role !== 'admin') return <Redirect href="/(agrivision)" />;

  // Web: render the full SoilzePro shell
  if (Platform.OS === 'web') {
    const PageComponent = PAGE_COMPONENTS[activeRoute] || DashboardPage;

    return (
      <SoilzeProShell activeRoute={activeRoute} onNavigate={setActiveRoute}>
        <PageComponent />
      </SoilzeProShell>
    );
  }

  // Native fallback: Station is web-only
  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackText}>⚠️ Station App is designed for Web/Desktop only.</Text>
    </View>
  );
}

export default function StationLayout() {
  if (Platform.OS === 'web') {
    return (
      <ThemeProvider>
        <StationContent />
      </ThemeProvider>
    );
  }

  return <StationContent />;
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DARK_COLORS.background,
    padding: 24,
  },
  fallbackText: {
    color: DARK_COLORS.primaryGlow,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
