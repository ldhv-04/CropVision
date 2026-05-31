/**
 * AlertsAdminScreen — Shared module component for alert management.
 * Used by both the Expo Router route (App/app/(main)/alerts.js)
 * and the GridShell ContentWidget.
 * Theme-aware: uses useTheme() for light/dark mode support.
 * Web-compatible: uses window.confirm for web, RNAlert for native.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, RefreshControl, Modal,
  KeyboardAvoidingView, Platform, Alert as RNAlert,
} from 'react-native';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';
import { SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { useTheme } from '../../@core/context/ThemeContext';

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Thông tin', icon: 'ℹ️', color: '#38bdf8' },
  { value: 'warning', label: 'Cảnh báo', icon: '⚠️', color: '#f59e0b' },
  { value: 'critical', label: 'Khẩn cấp', icon: '🚨', color: '#ef4444' },
];

function getSeverityMap(C) {
  return {
    info: { label: 'Thông tin', color: '#38bdf8', bg: C.infoBg || '#0a1f2e' },
    warning: { label: 'Cảnh báo', color: '#f59e0b', bg: C.warningBg || '#261a00' },
    critical: { label: 'Khẩn cấp', color: '#ef4444', bg: C.dangerBg || '#250e0e' },
  };
}

/** Cross-platform confirm: window.confirm on web, RNAlert on native */
function crossPlatformConfirm(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) {
      onConfirm();
    }
  } else {
    RNAlert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

/** Cross-platform alert */
function crossPlatformAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    RNAlert.alert(title, message);
  }
}

// ─── Styles factory ──────────────────────────────────────────────────
function getStyles(C) {
  return {
    root: { flex: 1, backgroundColor: C.background },
    scrollContent: { paddingBottom: 100, paddingHorizontal: SPACING.md },
    summaryRow: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.lg, marginBottom: SPACING.md },
    summaryCard: { flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    summaryNumber: { color: C.primaryGlow, fontSize: FONT_SIZE.xl, fontWeight: '800' },
    summaryLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
    suggestionsSection: { marginBottom: SPACING.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm },
    sectionHeaderText: { color: C.primaryGlow, fontSize: FONT_SIZE.md, fontWeight: '700' },
    suggestionCard: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: `${C.warning}30` },
    suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
    suggestionTitle: { color: C.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '700', flex: 1 },
    suggestionCount: { color: C.warning, fontSize: FONT_SIZE.sm, fontWeight: '800' },
    suggestionMeta: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginBottom: SPACING.sm },
    suggestionBtn: { backgroundColor: `${C.warning}20`, borderRadius: RADIUS.full, paddingVertical: SPACING.xs, alignItems: 'center', borderWidth: 1, borderColor: C.warning },
    suggestionBtnText: { color: C.warning, fontSize: FONT_SIZE.xs, fontWeight: '700' },
    alertCard: { backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border },
    alertCardInactive: { opacity: 0.5 },
    alertCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    alertCardIcon: { fontSize: 24 },
    alertCardTitleGroup: { flex: 1 },
    alertCardTitle: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
    alertCardDate: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
    severityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
    severityBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
    alertCardMessage: { color: C.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginBottom: SPACING.sm },
    geoInfo: { color: C.info, fontSize: FONT_SIZE.xs, marginBottom: SPACING.sm },
    alertCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    alertCardMeta: { flexDirection: 'row', gap: SPACING.md },
    metaText: { color: C.textMuted, fontSize: FONT_SIZE.xs },
    ackText: { color: C.primaryGlow, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    alertCardActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    metricsBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.info },
    metricsBtnText: { color: C.info, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    deactivateBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.danger },
    deactivateBtnText: { color: C.danger, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.xl, backgroundColor: C.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', marginTop: SPACING.md },
    emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
    emptyTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
    emptyDesc: { color: C.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center' },
    fab: { position: 'absolute', bottom: SPACING.xl, right: SPACING.lg, left: SPACING.lg, backgroundColor: C.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.full, gap: SPACING.sm, shadowColor: C.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    fabIcon: { color: '#fff', fontSize: 20, fontWeight: '800' },
    fabText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
    modalRoot: { flex: 1, backgroundColor: C.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    modalTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
    modalClose: { color: C.textMuted, fontSize: FONT_SIZE.xl, fontWeight: '300', padding: SPACING.sm },
    modalBody: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
    formLabel: { color: C.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.md },
    input: { backgroundColor: C.surface, color: C.textPrimary, borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 13, fontSize: FONT_SIZE.md },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    severityRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
    severityChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
    severityChipIcon: { fontSize: 16 },
    severityChipText: { color: C.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    geoToggle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, marginTop: SPACING.sm },
    geoToggleText: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
    geoSection: { marginBottom: SPACING.md },
    mapPlaceholder: { height: 200, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
    geoInputs: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    submitBtn: { backgroundColor: C.danger, paddingVertical: SPACING.md, borderRadius: RADIUS.full, alignItems: 'center', marginTop: SPACING.xl },
    submitBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
    metricsTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.lg },
    metricsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    metricCard: { flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    metricNumber: { color: C.primaryGlow, fontSize: FONT_SIZE.xl, fontWeight: '800' },
    metricLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
    progressBarBg: { height: 8, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.md },
    progressBarFill: { height: '100%', backgroundColor: C.primaryGlow, borderRadius: 4 },
    metricDetail: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  };
}

// ─── Leaflet Map Picker (Web only) ───────────────────────────────────
function LeafletMapPicker({ onLocationSelected, initialLat, initialLng, initialRadius, borderColor }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const loadMap = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const center = [initialLat || 10.8, initialLng || 106.7];
      const zoom = initialLat ? 10 : 6;
      const map = L.map(mapRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri', maxZoom: 17.8,
      }).addTo(map);

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' });
      L.control.layers({
        '🛰️ Vệ tinh': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 17.8 }),
        '🗺️ Bản đồ': streetLayer,
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) map.removeLayer(markerRef.current);
        if (circleRef.current) map.removeLayer(circleRef.current);

        markerRef.current = L.marker([lat, lng]).addTo(map)
          .bindPopup(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();

        const radius = initialRadius || 30;
        circleRef.current = L.circle([lat, lng], {
          radius: radius * 1000, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2,
        }).addTo(map);

        onLocationSelected(lat, lng, radius);
      });
    };

    loadMap();
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', border: `1px solid ${borderColor}` }} />;
}

// ─── Create Alert Modal ──────────────────────────────────────────────
function CreateAlertModal({ visible, onClose, onSubmit, isLoading, C, styles }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [targetRegion, setTargetRegion] = useState('');
  const [targetCrop, setTargetCrop] = useState('');
  const [geoLat, setGeoLat] = useState(null);
  const [geoLng, setGeoLng] = useState(null);
  const [geoRadius, setGeoRadius] = useState('30');
  const [useGeo, setUseGeo] = useState(false);

  const handleLocationSelected = (lat, lng, radius) => {
    setGeoLat(lat); setGeoLng(lng); setGeoRadius(String(radius));
  };

  const handleSubmit = () => {
    if (!title.trim()) return crossPlatformAlert('Lỗi', 'Vui lòng nhập tiêu đề.');
    if (!message.trim()) return crossPlatformAlert('Lỗi', 'Vui lòng nhập nội dung.');
    onSubmit({
      title: title.trim(), message: message.trim(), severity,
      target_region: targetRegion.trim() || null, target_crop: targetCrop.trim() || null,
      target_lat: useGeo ? geoLat : null, target_lng: useGeo ? geoLng : null,
      target_radius_km: useGeo ? parseFloat(geoRadius) : null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tạo cảnh báo mới</Text>
          <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>
        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.formLabel}>Tiêu đề *</Text>
          <TextInput style={styles.input} placeholder="VD: Cảnh báo đạo ôn tại Đồng Tháp" placeholderTextColor={C.placeholder} value={title} onChangeText={setTitle} />

          <Text style={styles.formLabel}>Nội dung *</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Mô tả chi tiết, khuyến nghị hành động..." placeholderTextColor={C.placeholder} value={message} onChangeText={setMessage} multiline numberOfLines={4} />

          <Text style={styles.formLabel}>Mức độ</Text>
          <View style={styles.severityRow}>
            {SEVERITY_OPTIONS.map((opt) => (
              <Pressable key={opt.value} style={[styles.severityChip, severity === opt.value && { borderColor: opt.color, backgroundColor: `${opt.color}20` }]} onPress={() => setSeverity(opt.value)}>
                <Text style={styles.severityChipIcon}>{opt.icon}</Text>
                <Text style={[styles.severityChipText, severity === opt.value && { color: opt.color }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.formLabel}>Khu vực mục tiêu</Text>
          <TextInput style={styles.input} placeholder="VD: Đồng Tháp, Long An (để trống = tất cả)" placeholderTextColor={C.placeholder} value={targetRegion} onChangeText={setTargetRegion} />

          <Text style={styles.formLabel}>Cây trồng</Text>
          <TextInput style={styles.input} placeholder="VD: Lúa, Cà chua (để trống = tất cả)" placeholderTextColor={C.placeholder} value={targetCrop} onChangeText={setTargetCrop} />

          <Pressable style={styles.geoToggle} onPress={() => setUseGeo(!useGeo)}>
            <Text style={styles.geoToggleText}>{useGeo ? '✅' : '⬜'} Giới hạn theo khu vực trên bản đồ</Text>
          </Pressable>

          {useGeo && (
            <View style={styles.geoSection}>
              <Text style={styles.formLabel}>Chọn vị trí trên bản đồ (nhấp để đặt)</Text>
              {Platform.OS === 'web' ? (
                <LeafletMapPicker onLocationSelected={handleLocationSelected} initialLat={geoLat} initialLng={geoLng} initialRadius={parseFloat(geoRadius) || 30} borderColor={C.border} />
              ) : (
                <View style={styles.mapPlaceholder}><Text style={{ color: C.textMuted, fontSize: FONT_SIZE.sm }}>Chức năng chọn trên bản đồ chỉ khả dụng trên web.</Text></View>
              )}
              <View style={styles.geoInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Vĩ độ</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={geoLat ? String(geoLat) : ''} onChangeText={(v) => setGeoLat(parseFloat(v) || null)} placeholder="10.7769" placeholderTextColor={C.placeholder} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Kinh độ</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={geoLng ? String(geoLng) : ''} onChangeText={(v) => setGeoLng(parseFloat(v) || null)} placeholder="106.7009" placeholderTextColor={C.placeholder} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Bán kính (km)</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={geoRadius} onChangeText={setGeoRadius} placeholder="30" placeholderTextColor={C.placeholder} />
                </View>
              </View>
            </View>
          )}

          <Pressable style={[styles.submitBtn, isLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>📢 Gửi cảnh báo</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Metrics Modal ───────────────────────────────────────────────────
function MetricsModal({ alertId, visible, onClose, token, C, styles }) {
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

// ─── Auto-Suggestions Panel ──────────────────────────────────────────
function SuggestionsPanel({ token, onCreateFromSuggestion, C, styles }) {
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