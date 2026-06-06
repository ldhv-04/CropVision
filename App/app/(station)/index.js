/**
 * CropVision Station — Command Center
 *
 * Admin dashboard showing system KPIs, recent activity,
 * and disease frequency chart.
 * Dark mode, Grafana-inspired Grid layout.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator, Platform
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useAdminStore } from '../../src/modules/admin/store/useAdminStore';
import { KpiCard } from '../../src/modules/station/components/KpiCard';
import { DARK_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

// StationShell — web-only station shell boundary.
let StationShell = null;
if (Platform.OS === 'web') {
  StationShell = require('../../src/modules/station/shell').StationShell;
}

const C = DARK_COLORS;

// Simple bar chart using RN Views (fallback if gifted-charts fails on native)
function DiseaseBars({ samples }) {
  const diseaseCount = {};
  samples.forEach(s => {
    s.detections?.forEach(d => {
      if (d.disease_class) {
        diseaseCount[d.disease_class] = (diseaseCount[d.disease_class] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(diseaseCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  if (sorted.length === 0) {
    return <Text style={styles.emptyChartText}>Chưa có dữ liệu bệnh</Text>;
  }

  const maxVal = sorted[0][1];

  return (
    <View style={styles.chartContainer}>
      {sorted.map(([disease, count], idx) => {
        const pct = (count / maxVal) * 100;
        const barColor = idx === 0 ? C.danger : idx === 1 ? C.warning : C.info;
        return (
          <View key={disease} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {disease.replace(/_/g, ' ')}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.barCount, { color: barColor }]}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ActivityRow({ sample }) {
  const topDisease = sample.detections?.[0];
  const conf = topDisease ? Math.round(topDisease.confidence * 100) : null;
  const confColor = conf >= 70 ? C.danger : conf >= 40 ? C.warning : C.success;

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityLeft}>
        <View style={[styles.activityDot, { backgroundColor: confColor }]} />
        <View>
          <Text style={styles.activityName} numberOfLines={1}>
            {topDisease?.disease_class?.replace(/_/g, ' ') || 'Không phát hiện'}
          </Text>
          <Text style={styles.activityMeta}>
            👤 {sample.owner_name || sample.owner_email} · {new Date(sample.created_at).toLocaleString('vi-VN')}
          </Text>
        </View>
      </View>
      {conf && (
        <Text style={[styles.activityConf, { color: confColor }]}>{conf}%</Text>
      )}
    </View>
  );
}

export default function StationCommandCenter() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { summary, samples, users, isLoading, isRefreshing, error, loadAdminData } = useAdminStore();

  useEffect(() => {
    loadAdminData(token);
  }, []);

  // ── Web: render the station-owned shell boundary ──
  if (Platform.OS === 'web' && StationShell) {
    return <StationShell />;
  }

  // ── Mobile: keep existing native layout ──
  const onRefresh = () => loadAdminData(token, true);

  const recentSamples = samples.slice(0, 10);
  const todaySamples = samples.filter(s => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  // Compute avg confidence
  let avgConf = null;
  let totalConf = 0, confCount = 0;
  samples.forEach(s => {
    s.detections?.forEach(d => {
      totalConf += d.confidence;
      confCount++;
    });
  });
  if (confCount > 0) avgConf = Math.round((totalConf / confCount) * 100);

  return (
    <ScrollView
      testID="station-dashboard"
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🛰️ Command Center</Text>
          <Text style={styles.headerSub}>
            Xin chào, {user?.fullName || user?.email} · Admin
          </Text>
        </View>
        <Pressable testID="btn-station-logout" style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/welcome'); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {isLoading && samples.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={C.primaryGlow} size="large" />
          <Text style={styles.loadingText}>Đang tải dữ liệu hệ thống...</Text>
        </View>
      ) : (
        <>
          {/* KPI Grid */}
          <Text style={styles.sectionTitle}>📊 Chỉ số hệ thống</Text>
          <View style={styles.kpiGrid}>
            <KpiCard
              testID="kpi-users"
              icon="👥"
              label="Người dùng"
              value={summary?.total_users ?? users.length}
              subValue="Đã đăng ký"
              color={C.info}
            />
            <KpiCard
              testID="kpi-samples"
              icon="🔬"
              label="Mẫu phân tích"
              value={summary?.total_samples ?? samples.length}
              subValue="Tổng cộng"
              color={C.primary}
            />
          </View>
          <View style={[styles.kpiGrid, { marginTop: SPACING.sm }]}>
            <KpiCard
              testID="kpi-today"
              icon="📅"
              label="Hôm nay"
              value={todaySamples.length}
              subValue="Mẫu mới"
              color={C.success}
              trendUp={todaySamples.length > 0}
            />
            <KpiCard
              testID="kpi-accuracy"
              icon="🎯"
              label="Độ tin cậy TB"
              value={avgConf !== null ? `${avgConf}%` : '—'}
              subValue="AI confidence"
              color={avgConf >= 70 ? C.success : avgConf >= 40 ? C.warning : C.danger}
            />
          </View>

          {/* Disease Chart */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📈 Tần suất bệnh phát hiện</Text>
            <DiseaseBars samples={samples} />
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Hoạt động gần đây</Text>
              <Text style={styles.sectionCount}>{recentSamples.length} mẫu</Text>
            </View>
            {recentSamples.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có mẫu phân tích nào</Text>
            ) : (
              recentSamples.map((s) => <ActivityRow key={s.id} sample={s} />)
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: SPACING.xxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { color: C.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '800' },
  headerSub: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 4 },
  logoutBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${C.danger}50`,
  },
  logoutText: { color: C.danger, fontSize: FONT_SIZE.sm, fontWeight: '600' },

  errorBanner: {
    margin: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: C.dangerBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.dangerBorder,
  },
  errorText: { color: C.danger, fontSize: FONT_SIZE.sm },

  loadingCenter: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  loadingText: { color: C.textMuted, fontSize: FONT_SIZE.sm },

  kpiGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },

  sectionCard: {
    margin: SPACING.md,
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  sectionCount: { color: C.textMuted, fontSize: FONT_SIZE.sm },

  // Bar chart
  chartContainer: { gap: SPACING.sm, paddingTop: SPACING.xs },
  emptyChartText: { color: C.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: SPACING.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  barLabel: { color: C.textSecondary, fontSize: FONT_SIZE.xs, width: 100, textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 8, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: RADIUS.full },
  barCount: { fontSize: FONT_SIZE.xs, fontWeight: '700', width: 30, textAlign: 'right' },

  // Activity rows
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  activityDot: { width: 8, height: 8, borderRadius: RADIUS.full },
  activityName: { color: C.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'capitalize' },
  activityMeta: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  activityConf: { fontSize: FONT_SIZE.sm, fontWeight: '700' },

  emptyText: { color: C.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', padding: SPACING.md },
});
