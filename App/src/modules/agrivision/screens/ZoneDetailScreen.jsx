import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useZoneMetrics from '../hooks/useZoneMetrics';
import useMetricStore from '../stores/metricStore';
import MetricCard from '../components/panels/MetricCard';

const STATUS_COLORS = { HEALTHY: '#10b981', WARNING: '#f59e0b', INFECTED: '#ef4444' };
const STATUS_LABELS = { HEALTHY: 'Healthy', WARNING: 'Warning', INFECTED: 'Infected' };

const METRIC_KEYS = ['temperature', 'soil_moisture', 'soil_ph', 'nitrogen', 'humidity'];

/**
 * ZoneDetailScreen — Full zone detail view with metric dashboard,
 * health timeline, activity log, disease history, and recommended actions.
 */
export default function ZoneDetailScreen() {
  const router = useRouter();
  const { id: zoneId, name, crop, status } = useLocalSearchParams();
  const { getAllFormattedMetrics, loading, fetchAllTimeSeries, trends } = useZoneMetrics(zoneId);
  const fetchHealthHistory = useMetricStore((s) => s.fetchHealthHistory);
  const [healthHistory, setHealthHistory] = useState([]);

  useEffect(() => {
    if (zoneId) {
      fetchAllTimeSeries('30d');
      fetchHealthHistory(zoneId).then(setHealthHistory);
    }
  }, [zoneId]);

  const metrics = getAllFormattedMetrics();
  const statusColor = STATUS_COLORS[status] || '#6b7280';
  const statusLabel = STATUS_LABELS[status] || status;

  if (loading && metrics.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.zoneName}>{name || `Zone ${zoneId}`}</Text>
          {crop && <Text style={styles.cropType}>{crop}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Metric Dashboard */}
        <Text style={styles.sectionTitle}>📊 Metrics Dashboard</Text>
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

        {/* Health Timeline */}
        <Text style={styles.sectionTitle}>🩺 Health Timeline</Text>
        <View style={styles.timeline}>
          {healthHistory.length > 0 ? healthHistory.map((entry, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: STATUS_COLORS[entry.status] || '#6b7280' }]} />
              {i < healthHistory.length - 1 && <View style={styles.timelineLine} />}
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>{entry.status}</Text>
                <Text style={styles.timelineDate}>
                  {new Date(entry.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {entry.reason ? ` — ${entry.reason}` : ''}
                </Text>
              </View>
            </View>
          )) : (
            <Text style={styles.emptyText}>No health history available</Text>
          )}
        </View>

        {/* Recommended Actions */}
        <Text style={styles.sectionTitle}>💡 Recommended Actions</Text>
        <View style={styles.actionsList}>
          {status === 'INFECTED' && (
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>💊</Text>
              <Text style={styles.actionText}>Apply fungicide treatment immediately</Text>
            </View>
          )}
          {status === 'WARNING' && (
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionText}>Schedule field inspection within 48 hours</Text>
            </View>
          )}
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Next inspection due in 3 days</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionText}>Take a photo scan for AI analysis</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => {}}>
            <Text style={styles.primaryBtnText}>📷 Scan Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => {}}>
            <Text style={styles.secondaryBtnText}>🦠 Report Disease</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.15)', gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: '#818cf8', fontSize: 14, fontWeight: '600' },
  headerInfo: { flex: 1 },
  zoneName: { color: '#e2e8f0', fontSize: 18, fontWeight: '700' },
  cropType: { color: '#64748b', fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 12,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, position: 'relative' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  timelineLine: {
    position: 'absolute', left: 4, top: 14, bottom: -16, width: 2,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  timelineContent: { flex: 1 },
  timelineStatus: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  timelineDate: { color: '#64748b', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#64748b', fontSize: 12, fontStyle: 'italic' },
  actionsList: { gap: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 8 },
  actionIcon: { fontSize: 16 },
  actionText: { color: '#94a3b8', fontSize: 13, flex: 1 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  primaryBtn: { flex: 1, backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: { flex: 1, backgroundColor: 'rgba(148,163,184,0.1)', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)' },
  secondaryBtnText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
});