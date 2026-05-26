/**
 * WeatherWidget — AgriVision Component
 *
 * Displays real-time weather data for a field location.
 * Shows temperature, humidity, rain, and weather description.
 */

import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

const C = LIGHT_COLORS;

const WEATHER_ICONS = {
  'mưa':       '🌧️',
  'nắng':      '☀️',
  'nắng nhẹ':  '🌤️',
  'mây':       '☁️',
  'giông':     '⛈️',
  'sương mù':  '🌫️',
  'default':   '🌡️',
};

function getWeatherIcon(description = '') {
  const lower = description.toLowerCase();
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return WEATHER_ICONS.default;
}

function WeatherStat({ label, value, unit, icon }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}<Text style={styles.statUnit}>{unit}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function WeatherWidget({ weather, fieldName, isLoading, onRefresh }) {
  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={C.primary} />
        <Text style={styles.loadingText}>Đang tải thời tiết...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.emptyIcon}>🌐</Text>
        <Text style={styles.emptyText}>Chọn cánh đồng để xem thời tiết</Text>
      </View>
    );
  }

  const icon = getWeatherIcon(weather.description);
  const rainLevel = weather.rain_1h > 5 ? 'danger' : weather.rain_1h > 1 ? 'warning' : 'success';
  const humidityLevel = weather.humidity > 90 ? 'danger' : weather.humidity > 75 ? 'warning' : 'success';

  return (
    <Pressable style={styles.card} onPress={onRefresh}>
      <View style={styles.header}>
        <View>
          <Text style={styles.fieldName}>{fieldName || 'Cánh đồng của tôi'}</Text>
          <Text style={styles.description}>{icon} {weather.description}</Text>
        </View>
        <View style={styles.tempBadge}>
          <Text style={styles.temp}>{weather.temp?.toFixed(1)}°</Text>
          <Text style={styles.tempUnit}>C</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <WeatherStat
          label="Độ ẩm"
          value={weather.humidity}
          unit="%"
          icon="💧"
        />
        <WeatherStat
          label="Lượng mưa"
          value={weather.rain_1h?.toFixed(1) ?? '0'}
          unit="mm/h"
          icon="🌧️"
        />
        <WeatherStat
          label="Gió"
          value={weather.wind_speed?.toFixed(1) ?? '0'}
          unit="m/s"
          icon="💨"
        />
      </View>

      {weather.rain_1h > 1 && (
        <View style={[styles.alert, styles[`alert_${rainLevel}`]]}>
          <Text style={styles.alertText}>
            ⚠️ Có mưa — nên dùng thuốc bám dính khi phun
          </Text>
        </View>
      )}

      <Text style={styles.refreshHint}>Nhấn để làm mới • Cập nhật mỗi 30 phút</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  loadingCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  loadingText: { color: C.textSecondary, fontSize: FONT_SIZE.sm },
  emptyCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
    backgroundColor: C.surfaceAlt,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: C.textMuted, fontSize: FONT_SIZE.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  fieldName: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
    textTransform: 'capitalize',
  },
  tempBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${C.primary}12`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  temp: {
    color: C.primary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  tempUnit: {
    color: C.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: SPACING.sm,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  statUnit: { fontSize: FONT_SIZE.xs, color: C.textSecondary, fontWeight: '400' },
  statLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  alert: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  alert_warning: { backgroundColor: C.warningBg, borderWidth: 1, borderColor: C.warningBorder },
  alert_danger:  { backgroundColor: C.dangerBg,  borderWidth: 1, borderColor: C.dangerBorder },
  alert_success: { backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder },
  alertText: { color: C.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  refreshHint: {
    color: C.textMuted,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
