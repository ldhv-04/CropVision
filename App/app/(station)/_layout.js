/**
 * CropVision Station Layout — Admin Web Command Center
 *
 * Tab navigator with dark mode theme.
 * Grafana-inspired professional dashboard aesthetic.
 */

import { Tabs } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { DARK_COLORS, SPACING, FONT_SIZE } from '../../src/modules/@core/constants/theme';

const C = DARK_COLORS;

function TabIcon({ icon, label, focused }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabIconEmoji, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabIconLabel, focused && styles.tabIconLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function StationLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) return <Redirect href="/welcome" />;
  if (user?.role !== 'admin') return <Redirect href="/(agrivision)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.primaryGlow,
        headerTitleStyle: { color: C.textPrimary, fontWeight: '700', fontSize: FONT_SIZE.md },
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: C.primaryGlow,
        tabBarInactiveTintColor: C.textMuted,
        tabBarShowLabel: false,
        sceneContainerStyle: { backgroundColor: C.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: '🛰️ CropVision Station',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="system"
        options={{
          headerTitle: '⚙️ System Manager',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="System" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', paddingTop: 4 },
  tabIconEmoji: { fontSize: 20, opacity: 0.5 },
  tabIconFocused: { opacity: 1 },
  tabIconLabel: { color: C.textMuted, fontSize: 10, marginTop: 2, fontWeight: '600' },
  tabIconLabelFocused: { color: C.primaryGlow },
});
