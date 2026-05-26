/**
 * AgriVision Home Screen
 *
 * Main dashboard for farmers. Shows:
 * - Greeting + weather widget for current device location
 * - Quick action buttons (Diagnose, Manage Fields)
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Alert
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useFieldStore } from '../../src/modules/agrivision/store/useFieldStore';
import { WeatherWidget } from '../../src/modules/agrivision/components/WeatherWidget';
import { apiRequest } from '../../src/modules/@core/api/apiClient';
import { ENDPOINTS } from '../../src/modules/@core/api/endpoints';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

const C = LIGHT_COLORS;

function QuickActionButton({ icon, label, sublabel, onPress, color = C.primary, id }) {
  return (
    <Pressable
      id={id}
      style={[styles.actionBtn, { borderColor: `${color}40` }]}
      onPress={onPress}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      {sublabel && <Text style={styles.actionSublabel}>{sublabel}</Text>}
    </Pressable>
  );
}

export default function AgriVisionHome() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const { fields, fetchFields } = useFieldStore();
  const [refreshing, setRefreshing] = useState(false);
  const [localWeather, setLocalWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const loadWeather = async () => {
    try {
      setWeatherLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Từ chối quyền vị trí', 'Không thể lấy thông tin thời tiết địa phương vì thiếu quyền vị trí.');
        setWeatherLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const data = await apiRequest(
        ENDPOINTS.weather.current(location.coords.latitude, location.coords.longitude),
        {},
        token
      );

      if (data.success) {
        setLocalWeather(data.data);
      }
    } catch (error) {
      console.warn('Failed to load local weather:', error.message);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    await fetchFields(token);
    await loadWeather();
  }, [token]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <ScrollView
      testID="agrivision-home"
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
    >
      {/* Greeting Header */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting()}, 👨‍🌾</Text>
        <Text style={styles.userName}>{user?.fullName || user?.email}</Text>
        <Text style={styles.subGreeting}>
          {fields.length > 0
            ? `Bạn đang quản lý ${fields.length} cánh đồng`
            : 'Hãy thêm cánh đồng đầu tiên của bạn'}
        </Text>
      </View>

      {/* Local Weather Widget */}
      <WeatherWidget
        weather={localWeather}
        fieldName="Vị trí hiện tại của bạn"
        isLoading={weatherLoading}
        onRefresh={loadWeather}
      />

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      <View style={styles.actionsGrid}>
        <QuickActionButton
          testID="btn-fields"
          icon="🌾"
          label="Cánh đồng của tôi"
          sublabel={`${fields.length} cánh đồng đang quản lý`}
          color="#0369a1"
          onPress={() => router.push('/(agrivision)/fields')}
        />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: SPACING.xxl },

  greetingSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  greeting: { color: C.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  userName: { color: C.textPrimary, fontSize: FONT_SIZE.xxl, fontWeight: '800', marginTop: 2 },
  subGreeting: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 4 },

  sectionTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { fontSize: 32, marginBottom: SPACING.sm },
  actionLabel: { fontSize: FONT_SIZE.md, fontWeight: '700', textAlign: 'center' },
  actionSublabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 4, textAlign: 'center' },
});
