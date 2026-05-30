import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  HEALTHY: '#10b981',
  WARNING: '#f59e0b',
  INFECTED: '#ef4444',
};

const STATUS_LABELS = {
  HEALTHY: 'Healthy',
  WARNING: 'Warning',
  INFECTED: 'Infected',
};

/**
 * ZoneSummaryCard — Mini zone info card shown in the BottomDrawer peek state.
 */
export default function ZoneSummaryCard({ zone }) {
  if (!zone) return null;

  const statusColor = STATUS_COLORS[zone.status] || '#6b7280';
  const statusLabel = STATUS_LABELS[zone.status] || zone.status;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{zone.name || zone.crop_type || `Zone ${zone.id}`}</Text>
          {zone.crop_type && (
            <Text style={styles.crop}>• {zone.crop_type}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Quick metrics row */}
      {zone.temperature != null && (
        <View style={styles.quickMetrics}>
          <Text style={styles.quickMetric}>🌡 {parseFloat(zone.temperature).toFixed(0)}°C</Text>
          <Text style={styles.quickMetric}>💧 {parseFloat(zone.soil_moisture || zone.humidity || 0).toFixed(0)}%</Text>
          <Text style={styles.quickMetric}>⚗ pH {parseFloat(zone.soil_ph || zone.ph || 0).toFixed(1)}</Text>
          <Text style={styles.quickMetric}>🧪 N:{parseFloat(zone.nitrogen || zone.ec * 25 || 0).toFixed(0)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  name: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  crop: {
    color: '#64748b',
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quickMetrics: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  quickMetric: {
    color: '#94a3b8',
    fontSize: 12,
  },
});