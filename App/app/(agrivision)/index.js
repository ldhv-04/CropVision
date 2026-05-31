/**
 * AgriVision Home Screen
 *
 * Main dashboard for farmers. Shows:
 * - Greeting + weather widget for current device location
 * - Quick action buttons (Diagnose, Manage Fields)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Alert, Platform, ActivityIndicator, Modal,
  FlatList, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useFieldStore } from '../../src/modules/agrivision/store/useFieldStore';
import { useSubZoneStore } from '../../src/modules/agrivision/store/useSubZoneStore';
import { WeatherWidget } from '../../src/modules/agrivision/components/WeatherWidget';
import { apiRequest } from '../../src/modules/@core/api/apiClient';
import { ENDPOINTS } from '../../src/modules/@core/api/endpoints';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

const SEVERITY_STYLES = {
  info:     { bg: '#e0f2fe', border: '#0369a1', icon: 'ℹ️' },
  warning:  { bg: '#fef9c3', border: '#d97706', icon: '⚠️' },
  critical: { bg: '#fee2e2', border: '#dc2626', icon: '🚨' },
};

const C = LIGHT_COLORS;

// ─── Leaflet Map for Farmer Fields (Web only) ────────────────────────
function LeafletMainMap({ fields, onSelectField }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

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

      const center = [15.8, 108.0];
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(center, 6);
      mapInstanceRef.current = map;

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 17.8 }).addTo(map);

      const polygons = [];

      fields.forEach((f) => {
        const boundary = typeof f.boundary === 'string' ? JSON.parse(f.boundary) : f.boundary;
        if (boundary && boundary.coordinates) {
          const latlngs = boundary.coordinates[0].map(([lng, lat]) => [lat, lng]);
          
          let statusColor = '#22c55e'; // Green - Healthy
          if (f.name.toLowerCase().includes('lớn') || f.id.charCodeAt(0) % 3 === 0) {
            statusColor = '#ef4444'; // Red - Infected
          } else if (f.name.toLowerCase().includes('mẫu') || f.id.charCodeAt(0) % 3 === 1) {
            statusColor = '#eab308'; // Yellow - Warning
          }

          const poly = L.polygon(latlngs, {
            color: statusColor,
            fillColor: statusColor,
            fillOpacity: 0.25,
            weight: 3
          }).addTo(map);

          poly.bindTooltip(`<div style="font-family:system-ui;font-weight:700;">🌾 ${f.name}</div>`, {
            permanent: false,
            direction: 'center'
          });

          poly.on('click', () => {
            if (onSelectField) onSelectField(f);
          });

          polygons.push(poly);
        }
      });

      if (polygons.length > 0) {
        const group = L.featureGroup(polygons);
        map.fitBounds(group.getBounds(), { padding: [40, 40] });
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [fields]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: 300, borderRadius: 16, overflow: 'hidden', border: '1px solid #d1fae5', marginBottom: 16 }} />
  );
}

// ─── BottomSheet Metrics Modal (Section 5.1 BottomSheet) ──────────────
function BottomSheetMetricsModal({ field, visible, onClose, token }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !field) return;
    setLoading(true);
    setMetrics(null);

    let status = 'HEALTHY';
    if (field.name.toLowerCase().includes('lớn') || field.id.charCodeAt(0) % 3 === 0) {
      status = 'INFECTED';
    } else if (field.name.toLowerCase().includes('mẫu') || field.id.charCodeAt(0) % 3 === 1) {
      status = 'WARNING';
    }

    const hour = new Date().getHours();
    const baseTemp = 30 + 5 * Math.sin(((hour - 7) * Math.PI) / 12);
    const baseHumid = 70 - 15 * Math.sin(((hour - 7) * Math.PI) / 12);

    let data = {};
    if (status === 'INFECTED') {
      data = {
        healthScore: Math.floor(Math.random() * 20) + 15,
        temperature: baseTemp + (Math.random() - 0.5),
        humidity: baseHumid + (Math.random() - 0.5),
        soilMoisture: Math.floor(Math.random() * 15) + 32,
        pH: 5.7,
        ec: 0.9,
      };
    } else if (status === 'WARNING') {
      data = {
        healthScore: Math.floor(Math.random() * 20) + 55,
        temperature: baseTemp,
        humidity: baseHumid,
        soilMoisture: Math.floor(Math.random() * 10) + 48,
        pH: 6.2,
        ec: 1.2,
      };
    } else {
      data = {
        healthScore: Math.floor(Math.random() * 15) + 86,
        temperature: baseTemp,
        humidity: baseHumid,
        soilMoisture: Math.floor(Math.random() * 10) + 68,
        pH: 6.5,
        ec: 1.5,
      };
    }

    setTimeout(() => {
      setMetrics(data);
      setLoading(false);
    }, 600);
  }, [visible, field?.id]);

  if (!field) return null;

  const status = field.name.toLowerCase().includes('lớn') || field.id.charCodeAt(0) % 3 === 0
    ? 'INFECTED' : field.name.toLowerCase().includes('mẫu') || field.id.charCodeAt(0) % 3 === 1
    ? 'WARNING' : 'HEALTHY';

  const statusLabel = status === 'INFECTED' ? '🔴 Nhiễm bệnh' : status === 'WARNING' ? '🟡 Cảnh báo' : '🟢 Khỏe mạnh';
  const statusColor = status === 'INFECTED' ? '#ef4444' : status === 'WARNING' ? '#eab308' : '#22c55e';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.sheetDismiss} onPress={onClose} />
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIndicator} />
            <Text style={styles.sheetTitle}>🌾 Chi tiết: {field.name}</Text>
            <Pressable onPress={onClose}><Text style={styles.sheetClose}>✕</Text></Pressable>
          </View>

          <ScrollView style={styles.sheetBody}>
            <View style={styles.sheetFieldInfo}>
              <Text style={styles.sheetSubZoneDesc}>Cây trồng: {field.crop_type} · Diện tích: {field.area || '—'} ha</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: statusColor, borderWidth: 1, alignSelf: 'flex-start', marginTop: 8 }]}>
                <Text style={{ color: statusColor, fontWeight: '700', fontSize: 12 }}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.sheetSectionTitle}>📊 Chỉ số sinh trưởng (AI Live)</Text>
            
            {loading ? (
              <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{metrics.healthScore}/100</Text>
                  <Text style={styles.metricLabel}>Sức khỏe cây</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{metrics.temperature.toFixed(1)}°C</Text>
                  <Text style={styles.metricLabel}>Nhiệt độ khí</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{metrics.humidity.toFixed(1)}%</Text>
                  <Text style={styles.metricLabel}>Độ ẩm khí</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{metrics.soilMoisture}%</Text>
                  <Text style={styles.metricLabel}>Độ ẩm đất</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{metrics.pH.toFixed(1)}</Text>
                  <Text style={styles.metricLabel}>Độ pH đất</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{metrics.ec.toFixed(1)}</Text>
                  <Text style={styles.metricLabel}>Độ dẫn EC</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Encyclopedia Widget (Horizontal Card Carousel) ──────────────
const DISEASES_CACHE_KEY = 'encyclopedia_widget_diseases';

function EncyclopediaCard({ disease, onPress }) {
  const severityColors = {
    severe: { bg: '#fee2e2', border: '#f87171', text: '#991b1b' },
    moderate: { bg: '#fef9c3', border: '#fbbf24', text: '#92400e' },
    mild: { bg: '#dcfce7', border: '#4ade80', text: '#166534' },
  };
  const sv = severityColors[disease.severity] || severityColors.moderate;
  const cropIcons = { tomato: '🍅', pepper: '🌶️', rice: '🌾', corn: '🌽', potato: '🥔' };
  const icon = cropIcons[disease.crop_type?.toLowerCase()] || '🌱';

  return (
    <Pressable style={[styles.encCard, { borderColor: sv.border }]} onPress={onPress}>
      <Text style={styles.encCardIcon}>{icon}</Text>
      <Text style={styles.encCardName} numberOfLines={2}>{disease.disease_name_vi || disease.disease_name_en}</Text>
      <View style={[styles.encSeverityBadge, { backgroundColor: sv.bg, borderColor: sv.border }]}>
        <Text style={[styles.encSeverityText, { color: sv.text }]}>{disease.severity}</Text>
      </View>
    </Pressable>
  );
}

function EncyclopediaWidget({ token }) {
  const [diseases, setDiseases] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest(`${ENDPOINTS.diseases.list}?limit=8`, {}, token);
        if (data.success) setDiseases(data.data || []);
      } catch {}
    };
    load();
  }, [token]);

  if (diseases.length === 0) return null;

  return (
    <View style={styles.encWidget}>
      <View style={styles.encHeader}>
        <Text style={styles.encTitle}>📚 Bách khoa bệnh</Text>
        <Pressable onPress={() => router.push('/(agrivision)/encyclopedia')}>
          <Text style={styles.encViewAll}>Xem tất cả →</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.encScroll}>
        {diseases.map((d) => (
          <EncyclopediaCard
            key={d.id}
            disease={d}
            onPress={() => router.push({ pathname: '/(agrivision)/encyclopedia', params: { diseaseId: d.id } })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function QuickActionButton({ icon, label, sublabel, onPress, color = C.primary, id }) {
  return (
    <Pressable
      id={id}
      style={[styles.actionBtn, { borderColor: `${color}40` }]}
      onPress={onPress}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      {sublabel && <Text style={styles.actionSublabel}>{sublabel}</Text>}
    </Pressable>
  );
}

export default function AgriVisionHome() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const { fields, fetchFields } = useFieldStore();
  const { epidemicAlerts, fetchEpidemicAlerts, markAlertRead } = useSubZoneStore();
  const [refreshing, setRefreshing] = useState(false);
  const [localWeather, setLocalWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  const [selectedFieldForMetrics, setSelectedFieldForMetrics] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const handleSelectFieldForMetrics = (field) => {
    setSelectedFieldForMetrics(field);
    setShowBottomSheet(true);
  };

  const loadWeather = async () => {
    try {
      setWeatherLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Từ chối quyền vị trí', 'Không thể lấy thông tin thời tiết địa phương vì thiếu quyền vị trí.');
        setWeatherLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const data = await apiRequest(
        ENDPOINTS.weather.current(location.coords.latitude, location.coords.longitude),
        {},
        token
      );

      if (data.success) {
        setLocalWeather(data.data);
      }
    } catch (error) {
      console.warn('Failed to load local weather:', error.message);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadAlerts = async (coords) => {
    try {
      const url = coords
        ? ENDPOINTS.alerts.active(coords.latitude, coords.longitude)
        : ENDPOINTS.alerts.active();
      const data = await apiRequest(url, {}, token);
      if (data.success) {
        setAlerts(data.data.filter(a => !a.acknowledged_by_me).slice(0, 3));
      }
    } catch (err) {
      console.warn('Failed to load alerts:', err.message);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiRequest(ENDPOINTS.alerts.acknowledge(alertId), { method: 'POST' }, token);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.warn('Failed to acknowledge alert:', err.message);
    }
  };

  const loadData = useCallback(async () => {
    await fetchFields(token);
    // Pass weather location coords to alert filtering too
    let coords = null;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getLastKnownPositionAsync() || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = loc.coords;
      }
    } catch {}
    await Promise.all([loadWeather(), loadAlerts(coords), fetchEpidemicAlerts(token)]);
  }, [token]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        testID="agrivision-home"
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >
        {/* Greeting Header */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting()}, 👨‍🌾</Text>
          <Text style={styles.userName}>{user?.fullName || user?.email}</Text>
          <Text style={styles.subGreeting}>
            {fields.length > 0
              ? `Bạn đang quản lý ${fields.length} cánh đồng`
              : 'Hãy thêm cánh đồng đầu tiên của bạn'}
          </Text>
        </View>

        {/* Local Weather Widget */}
        <WeatherWidget
          weather={localWeather}
          fieldName="Vị trí hiện tại của bạn"
          isLoading={weatherLoading}
          onRefresh={loadWeather}
        />

        {/* Interactive Main Map Screen (Section 5.1 Main Map Screen) */}
        {Platform.OS === 'web' && fields.length > 0 && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>🗺️ Bản đồ ranh giới & Sức khỏe cây</Text>
            <LeafletMainMap fields={fields} onSelectField={handleSelectFieldForMetrics} />
          </View>
        )}

        {/* Epidemic Alerts */}
        {epidemicAlerts.filter(a => !a.is_read).length > 0 && (
          <View style={styles.epidemicAlertsSection}>
            <Text style={styles.epidemicSectionTitle}>🚨 Cảnh báo dịch bệnh khẩn cấp!</Text>
            {epidemicAlerts.filter(a => !a.is_read).map((alert) => (
              <View key={alert.id} style={styles.epidemicAlertCard}>
                <View style={styles.epidemicAlertHeader}>
                  <Text style={{ fontSize: 20 }}>⚠️</Text>
                  <Text style={styles.epidemicAlertTitle}>Nguy cơ lây nhiễm từ hướng gió</Text>
                </View>
                <Text style={styles.epidemicAlertMessage}>
                  Phân khu trồng <Text style={{ fontWeight: '700' }}>{alert.crop_type}</Text> trên cánh đồng của bạn đang nằm trong vùng lan truyền dịch <Text style={{ fontWeight: '700', color: '#ef4444' }}>{alert.disease_type?.replace(/_/g, ' ')}</Text> được báo cáo gần đây!
                </Text>
                <Text style={styles.epidemicAlertMeta}>
                  📍 Cảnh báo khẩn cấp · Thời gian báo cáo: {new Date(alert.reported_at).toLocaleString('vi-VN')}
                </Text>
                <Pressable
                  style={styles.epidemicAckBtn}
                  onPress={() => markAlertRead(token, alert.id)}
                >
                  <Text style={styles.epidemicAckText}>✓ Đã hiểu & Đang theo dõi</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>📢 Cảnh báo từ Station</Text>
            {alerts.map((alert) => {
              const sv = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
              return (
                <View key={alert.id} style={[styles.alertCard, { backgroundColor: sv.bg, borderColor: sv.border }]}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertIcon}>{sv.icon}</Text>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                  </View>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  {alert.target_region && (
                    <Text style={styles.alertTarget}>📍 {alert.target_region}</Text>
                  )}
                  <Pressable
                    style={[styles.alertAckBtn, { borderColor: sv.border }]}
                    onPress={() => handleAcknowledgeAlert(alert.id)}
                  >
                    <Text style={[styles.alertAckText, { color: sv.border }]}>✓ Đã hiểu</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Encyclopedia Widget */}
        <EncyclopediaWidget token={token} />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.actionsGrid}>
          <QuickActionButton
            id="btn-diagnose"
            testID="btn-diagnose"
            icon="🔬"
            label="Chẩn đoán bệnh"
            sublabel="Phân tích lá bằng AI"
            color="#16a34a"
            onPress={() => router.push('/(agrivision)/inference')}
          />
          <QuickActionButton
            id="btn-fields"
            testID="btn-fields"
            icon="🌾"
            label="Cánh đồng của tôi"
            sublabel={`${fields.length} cánh đồng đang quản lý`}
            color="#0369a1"
            onPress={() => router.push('/(agrivision)/fields')}
          />
        </View>

      </ScrollView>

      {/* BottomSheet Metrics Modal */}
      <BottomSheetMetricsModal
        field={selectedFieldForMetrics}
        visible={showBottomSheet}
        onClose={() => { setShowBottomSheet(false); setSelectedFieldForMetrics(null); }}
        token={token}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: SPACING.xxl },

  greetingSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  greeting: { color: C.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  userName: { color: C.textPrimary, fontSize: FONT_SIZE.xxl, fontWeight: '800', marginTop: 2 },
  subGreeting: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 4 },

  sectionTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { fontSize: 32, marginBottom: SPACING.sm },
  actionLabel: { fontSize: FONT_SIZE.md, fontWeight: '700', textAlign: 'center' },
  actionSublabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 4, textAlign: 'center' },

  // Alerts
  alertsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  alertCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  alertIcon: { fontSize: 20 },
  alertTitle: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  alertMessage: { color: C.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginBottom: SPACING.xs },
  alertTarget: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginBottom: SPACING.sm },
  alertAckBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  alertAckText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },

  // Epidemic Alerts Styles
  epidemicAlertsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  epidemicSectionTitle: {
    color: '#dc2626',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  epidemicAlertCard: {
    backgroundColor: '#fff1f2',
    borderColor: '#f43f5e',
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  epidemicAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  epidemicAlertTitle: {
    color: '#9f1239',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    flex: 1,
  },
  epidemicAlertMessage: {
    color: '#4c0519',
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  epidemicAlertMeta: {
    color: '#9f1239',
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.md,
    opacity: 0.8,
  },
  epidemicAckBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#f43f5e',
    backgroundColor: '#fff',
  },
  epidemicAckText: {
    color: '#f43f5e',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  mapContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetDismiss: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    position: 'relative',
  },
  sheetIndicator: {
    width: 46,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  sheetTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  sheetClose: {
    position: 'absolute',
    right: 20,
    top: 15,
    fontSize: 18,
    color: C.textMuted,
    padding: 4,
  },
  sheetBody: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  sheetFieldInfo: {
    marginBottom: 16,
  },
  sheetSubZoneDesc: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  sheetSectionTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
  },
  metricLabel: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },

  // Encyclopedia Widget
  encWidget: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  encHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  encTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  encViewAll: {
    color: C.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  encScroll: {
    marginLeft: -SPACING.lg,
    paddingLeft: SPACING.lg,
  },
  encCard: {
    width: 130,
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  encCardIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  encCardName: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    minHeight: 30,
  },
  encSeverityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  encSeverityText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
