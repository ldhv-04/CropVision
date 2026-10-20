/**
 * AlertsModalsAndPanels.jsx — Metrics modal & suggestions panel for AlertsAdminScreen
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, Modal,
} from 'react-native';
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';
import { SPACING, FONT_SIZE } from '../../@core/constants/theme';

export function MetricsModal({ alertId, visible, onClose, token, C, styles }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !alertId) return;
    setLoading(true);
    apiRequest(ENDPOINTS.alerts.metrics(alertId), {}, token)
      .then((data) => { if (data.success) setMetrics(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, alertId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Thống kê cảnh báo</Text>
          <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.primary} size="large" /></View>
        ) : metrics ? (
          <ScrollView style={styles.modalBody}>
            <Text style={styles.metricsTitle}>{metrics.alert.title}</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}><Text style={styles.metricNumber}>{metrics.metrics.ack_percentage}%</Text><Text style={styles.metricLabel}>Đã xác nhận</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricNumber}>{metrics.metrics.ack_count}/{metrics.metrics.total_users}</Text><Text style={styles.metricLabel}>Người dùng</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricNumber}>{metrics.metrics.avg_response_hours || '—'}</Text><Text style={styles.metricLabel}>Giờ phản hồi TB</Text></View>
            </View>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${metrics.metrics.ack_percentage}%` }]} /></View>
            {metrics.metrics.first_ack_at && <Text style={styles.metricDetail}>Phản hồi đầu: {new Date(metrics.metrics.first_ack_at).toLocaleString('vi-VN')}</Text>}
            {metrics.metrics.last_ack_at && <Text style={styles.metricDetail}>Phản hồi gần nhất: {new Date(metrics.metrics.last_ack_at).toLocaleString('vi-VN')}</Text>}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.textMuted }}>Không có dữ liệu</Text></View>
        )}
      </View>
    </Modal>
  );
}

export function SuggestionsPanel({ token, onCreateFromSuggestion, C, styles }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(ENDPOINTS.alerts.suggestions(7, 5), {}, token);
      if (data.success) setSuggestions(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadSuggestions(); }, []);

  if (suggestions.length === 0 && !loading) return null;

  return (
    <View style={styles.suggestionsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>🤖 Gợi ý từ dữ liệu</Text>
        <Pressable onPress={loadSuggestions}><Text style={{ color: C.primaryGlow, fontSize: FONT_SIZE.xs, fontWeight: '600' }}>↻ Làm mới</Text></Pressable>
      </View>
      {loading && <ActivityIndicator color={C.primary} size="small" style={{ padding: SPACING.md }} />}
      {suggestions.map((s, i) => (
        <View key={i} style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={{ fontSize: 16 }}>{s.disease_severity === 'severe' ? '🚨' : '⚠️'}</Text>
            <Text style={styles.suggestionTitle} numberOfLines={1}>{s.disease_name_vi || s.disease_class}</Text>
            <Text style={styles.suggestionCount}>{s.scan_count} ca</Text>
          </View>
          <Text style={styles.suggestionMeta}>👨‍🌾 {s.affected_farmers} nông dân • 📍 ({s.avg_lat}, {s.avg_lng})</Text>
          <Pressable style={styles.suggestionBtn} onPress={() => onCreateFromSuggestion(s)}>
            <Text style={styles.suggestionBtnText}>Tạo cảnh báo từ gợi ý này</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
