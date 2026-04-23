import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { useLayoutMode } from '../../platform/hooks/useLayoutMode';

export function AdminSummaryGrid({ summary }) {
  const { isCompact } = useLayoutMode();
  const summaryCardWidth = isCompact ? '100%' : '23%';

  const cards = [
    { label: 'Tổng người dùng', value: summary?.total_users ?? 0 },
    { label: 'Tài khoản admin', value: summary?.total_admins ?? 0 },
    { label: 'Tổng mẫu vật', value: summary?.total_samples ?? 0 },
    { label: 'Tổng detection', value: summary?.total_detections ?? 0 },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View key={card.label} style={[styles.card, { width: summaryCardWidth }]}>
          <Text style={styles.label}>{card.label}</Text>
          <Text style={styles.value}>{card.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  value: { color: COLORS.textPrimary, fontSize: 32, fontWeight: 'bold' },
});
