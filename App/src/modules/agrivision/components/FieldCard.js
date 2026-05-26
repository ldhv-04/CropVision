/**
 * FieldCard — AgriVision Component
 *
 * Renders a single field as a premium card with crop type,
 * area info, and navigation to the inference screen.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

const C = LIGHT_COLORS;

const CROP_ICONS = {
  'lúa':       '🌾',
  'ngô':       '🌽',
  'cà chua':   '🍅',
  'khoai tây': '🥔',
  'đậu':       '🫘',
  'ớt':        '🌶️',
  'cải':       '🥬',
  'dưa':       '🍈',
  'mía':       '🎋',
  'unknown':   '🌿',
  'default':   '🌿',
};

function getCropIcon(cropType = '') {
  const lower = cropType.toLowerCase();
  for (const [key, icon] of Object.entries(CROP_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return CROP_ICONS.default;
}

export function FieldCard({ field, weather, onPress, isSelected }) {
  const cropIcon = getCropIcon(field.crop_type);
  const hasWeather = !!weather;

  return (
    <Pressable
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onPress(field)}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Text style={styles.cropIcon}>{cropIcon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.fieldName} numberOfLines={1}>{field.name}</Text>
          <Text style={styles.cropType}>{field.crop_type || 'Chưa xác định'}</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>✓ Đang dùng</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {field.area && (
          <View style={styles.stat}>
            <Text style={styles.statIcon}>📐</Text>
            <Text style={styles.statText}>{field.area} ha</Text>
          </View>
        )}
        {field.latitude && field.longitude && (
          <View style={styles.stat}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statText}>
              {parseFloat(field.latitude).toFixed(3)}, {parseFloat(field.longitude).toFixed(3)}
            </Text>
          </View>
        )}
      </View>

      {/* Weather strip */}
      {hasWeather && (
        <View style={styles.weatherStrip}>
          <Text style={styles.weatherText}>
            🌡️ {weather.temp?.toFixed(1)}°C · 💧 {weather.humidity}% · {weather.description}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: C.primary,
    backgroundColor: `${C.primary}08`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: `${C.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropIcon: { fontSize: 22 },
  info: { flex: 1 },
  fieldName: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  cropType: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  selectedBadge: {
    backgroundColor: C.successBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.successBorder,
  },
  selectedText: { color: C.success, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 13 },
  statText: { color: C.textMuted, fontSize: FONT_SIZE.xs },
  weatherStrip: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  weatherText: { color: C.textSecondary, fontSize: FONT_SIZE.xs },
});
