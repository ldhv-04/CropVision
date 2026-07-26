/**
 * CropVision Station Layout — SoilzePro-Based UI
 *
 * Replaces the legacy MapShell layout with SoilzePro's
 * navigation architecture: sidebar + header + content area.
 *
 * Source of truth: soilzepro-research/*
 * Legacy backup: App/app/(station-legacy)/
 */

import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { ThemeProvider } from '../../src/modules/@core/context/ThemeContext';
import { DARK_COLORS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

// Layout components
import { StationShell as SoilzeProShell } from '../../src/modules/station';

function StationContent() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) return <Redirect href="/welcome" />;
  if (user?.role !== 'admin') return <Redirect href="/(agrivision)" />;

  // Web: render the full SoilzePro shell
  if (Platform.OS === 'web') {
    return (
      <SoilzeProShell>
        <Slot />
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
