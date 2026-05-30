import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import ZoneSummaryCard from './ZoneSummaryCard';
import MetricCard from './MetricCard';
import useZoneMetrics from '../../hooks/useZoneMetrics';
import useFieldMapStore from '../../stores/fieldMapStore';

const METRIC_KEYS = ['temperature', 'soil_moisture', 'soil_ph', 'nitrogen'];

/**
 * BottomDrawer — Slide-up detail panel for selected zone.
 *
 * Three states: collapsed (hidden), peek (summary), expanded (full details).
 */
export default function BottomDrawer({ zone }) {
  const drawerState = useFieldMapStore((s) => s.drawerState);
  const setDrawerState = useFieldMapStore((s) => s.setDrawerState);
  const deselectZone = useFieldMapStore((s) => s.deselectZone);

  const { getAllFormattedMetrics, loading } = useZoneMetrics(zone?.id);

  if (!zone || drawerState === 'collapsed') return null;

  const isExpanded = drawerState === 'expanded';
  const metrics = getAllFormattedMetrics();

  return (
    <View style={[styles.container, isExpanded && styles.containerExpanded]}>
      {/* Drag handle */}
      <TouchableOpacity
        style={styles.handle}
        onPress={() => setDrawerState(isExpanded ? 'peek' : 'expanded')}
        activeOpacity={0.7}
      >
        <View style={styles.handleBar} />
      </TouchableOpacity>

      {/* Zone Summary */}
      <ZoneSummaryCard zone={zone} />

      {/* Metric Cards */}
      {isExpanded && (
        <ScrollView style={styles.metricsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <MetricCard
                key={index}
                icon={metric.icon}
                label={metric.label}
                value={metric.formatted}
                trend={metric.trend}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={styles.actionText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionIcon}>🦠</Text>
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionText}>Inspect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={() => setDrawerState('expanded')}
            >
              <Text style={[styles.actionText, styles.actionTextPrimary]}>Details →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={deselectZone}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '40%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  containerExpanded: {
    maxHeight: '65%',
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  metricsContainer: {
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    gap: 4,
  },
  actionBtnPrimary: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  actionTextPrimary: {
    color: '#10b981',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});