/**
 * KpiCard — CropVision Station Component
 *
 * Displays a single KPI metric with trend indicator.
 * Dark mode themed for the Command Center dashboard.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DARK_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

const C = DARK_COLORS;

export function KpiCard({ testID, icon, label, value, subValue, trend, trendUp, color = C.primary, onPress }) {
  const trendColor = trendUp === undefined ? C.textSecondary : trendUp ? C.success : C.danger;
  const trendIcon = trendUp === undefined ? '' : trendUp ? '↑' : '↓';

  return (
    <Pressable
      testID={testID}
      style={[styles.card, { borderTopColor: color, borderTopWidth: 3 }]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: `${trendColor}18` }]}>
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trendIcon} {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.value}>{value ?? '—'}</Text>
      <Text style={styles.label}>{label}</Text>
      {subValue && <Text style={styles.subValue}>{subValue}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  trendBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  trendText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  value: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: 4,
  },
  label: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  subValue: {
    color: C.textMuted,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
});
