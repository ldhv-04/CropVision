import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TREND_ARROWS = {
  up: '↗',
  down: '↘',
  stable: '→',
};

const TREND_COLORS = {
  up: '#10b981',
  down: '#ef4444',
  stable: '#64748b',
};

/**
 * MetricCard — Individual metric display with value, trend arrow, and mini sparkline.
 *
 * Used in the BottomDrawer expanded state and ZoneDetailScreen.
 */
export default function MetricCard({ icon, label, value, trend }) {
  const trendDir = trend?.direction || 'stable';
  const trendArrow = TREND_ARROWS[trendDir];
  const trendColor = TREND_COLORS[trendDir];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {trend && trend.delta !== 0 && (
          <Text style={[styles.trend, { color: trendColor }]}>
            {trendArrow} {trend.delta}
          </Text>
        )}
      </View>
      {/* Inline sparkline placeholder — real chart in M5 */}
      <View style={styles.sparklineContainer}>
        <View style={[styles.sparklineBar, { width: '60%', backgroundColor: trendColor + '40' }]} />
        <View style={[styles.sparklineBar, { width: '45%', backgroundColor: trendColor + '30' }]} />
        <View style={[styles.sparklineBar, { width: '70%', backgroundColor: trendColor + '50' }]} />
        <View style={[styles.sparklineBar, { width: '55%', backgroundColor: trendColor + '40' }]} />
        <View style={[styles.sparklineBar, { width: '80%', backgroundColor: trendColor + '60' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  value: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  trend: {
    fontSize: 11,
    fontWeight: '600',
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: 6,
    height: 16,
  },
  sparklineBar: {
    height: '100%',
    borderRadius: 2,
    minHeight: 3,
  },
});