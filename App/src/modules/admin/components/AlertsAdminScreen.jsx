/**
 * AlertsAdminScreen — Shared module component for alert management.
 * Station/Admin-owned alert management screen.
 * Legacy `(main)/alerts` and GridShell ContentWidget may still reach this
 * during route cleanup; new navigation should enter through Station.
 * Theme-aware: uses useTheme() for light/dark mode support.
 * Web-compatible: uses window.confirm for web, RNAlert for native.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
            <Text style={styles.suggestionBtnText}>Tạo cảnh báo từ gợi ý này</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function AlertsAdminScreen() {
  const token = useAuthStore((s) => s.token);
  const { colors } = useTheme();
  const C = colors;
  const styles = getStyles(C);
  const SEVERITY_MAP = getSeverityMap(C);

  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [metricsAlertId, setMetricsAlertId] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiRequest(ENDPOINTS.alerts.all, {}, token);
      if (data.success) setAlerts(data.data);
    } catch {}
  }, [token]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchAlerts();
    setIsLoading(false);
  }, [fetchAlerts]);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleCreate = async (alertData) => {
    setIsCreating(true);
    try {
      const data = await apiRequest(ENDPOINTS.alerts.create, { method: 'POST', body: JSON.stringify(alertData) }, token);
      if (data.success) {
        setShowCreate(false);
        setAlerts((prev) => [data.data, ...prev]);
        crossPlatformAlert('Thành công', 'Đã tạo cảnh báo mới.');
      } else {
        crossPlatformAlert('Lỗi', data.message);
      }
    } catch {
      crossPlatformAlert('Lỗi', 'Không thể tạo cảnh báo.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromSuggestion = (suggestion) => {
    setShowCreate(true);
  };

  const handleDeactivate = async (alertId) => {
    crossPlatformConfirm('Xác nhận', 'Tắt cảnh báo này?', async () => {
      try {
        await apiRequest(ENDPOINTS.alerts.deactivate(alertId), { method: 'PATCH' }, token);
        setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, is_active: false } : a));
      } catch { crossPlatformAlert('Lỗi', 'Không thể tắt cảnh báo.'); }
    });
  };

  return (
    <View testID="alerts-admin-screen" style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{alerts.length}</Text><Text style={styles.summaryLabel}>Tổng cảnh báo</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{alerts.filter(a => a.is_active).length}</Text><Text style={styles.summaryLabel}>Đang hoạt động</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{alerts.filter(a => a.severity === 'critical').length}</Text><Text style={styles.summaryLabel}>Khẩn cấp</Text></View>
        </View>

        <SuggestionsPanel token={token} onCreateFromSuggestion={handleCreateFromSuggestion} C={C} styles={styles} />

        {isLoading && <ActivityIndicator color={C.primary} size="large" style={{ paddingVertical: SPACING.xxl }} />}

        {!isLoading && alerts.map((alert) => {
          const sv = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.info;
          const ackPercent = alert.total_users > 0 ? Math.round((parseInt(alert.ack_count, 10) / parseInt(alert.total_users, 10)) * 100) : 0;
          return (
            <View key={alert.id} style={[styles.alertCard, !alert.is_active && styles.alertCardInactive]}>
              <View style={styles.alertCardHeader}>
                <Text style={styles.alertCardIcon}>{sv.label === 'Khẩn cấp' ? '🚨' : sv.label === 'Cảnh báo' ? '⚠️' : 'ℹ️'}</Text>
                <View style={styles.alertCardTitleGroup}>
                  <Text style={[styles.alertCardTitle, !alert.is_active && { color: C.textMuted }]} numberOfLines={1}>{alert.title}</Text>
                  <Text style={styles.alertCardDate}>{new Date(alert.created_at).toLocaleDateString('vi-VN')} • {alert.creator_name || 'System'}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: sv.bg }]}><Text style={[styles.severityBadgeText, { color: sv.color }]}>{sv.label}</Text></View>
              </View>
              <Text style={styles.alertCardMessage} numberOfLines={2}>{alert.message}</Text>
              {alert.target_lat && alert.target_lng && alert.target_radius_km && (
                <Text style={styles.geoInfo}>🎯 Bán kính {alert.target_radius_km}km quanh ({parseFloat(alert.target_lat).toFixed(2)}, {parseFloat(alert.target_lng).toFixed(2)})</Text>
              )}
              <View style={styles.alertCardFooter}>
                <View style={styles.alertCardMeta}>
                  {alert.target_region && <Text style={styles.metaText}>📍 {alert.target_region}</Text>}
                  {alert.target_crop && <Text style={styles.metaText}>🌱 {alert.target_crop}</Text>}
                </View>
                <Text style={styles.ackText}>{ackPercent}% ({alert.ack_count}/{alert.total_users})</Text>
              </View>
              <View style={styles.alertCardActions}>
                <Pressable style={styles.metricsBtn} onPress={() => { setMetricsAlertId(alert.id); setShowMetrics(true); }}>
                  <Text style={styles.metricsBtnText}>📊 Thống kê</Text>
                </Pressable>
                {alert.is_active && (
                  <Pressable style={styles.deactivateBtn} onPress={() => handleDeactivate(alert.id)}>
                    <Text style={styles.deactivateBtnText}>Tắt</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {!isLoading && alerts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>Chưa có cảnh báo nào</Text>
            <Text style={styles.emptyDesc}>Tạo cảnh báo đầu tiên để gửi đến nông dân.</Text>
          </View>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabText}>Tạo cảnh báo</Text>
      </Pressable>

      <CreateAlertModal visible={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} isLoading={isCreating} C={C} styles={styles} />
      <MetricsModal alertId={metricsAlertId} visible={showMetrics} onClose={() => { setShowMetrics(false); setMetricsAlertId(null); }} token={token} C={C} styles={styles} />
    </View>
  );
}
