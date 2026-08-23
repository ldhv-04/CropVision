/**
 * FarmOverviewTab — Tab 1: Màn hình khởi động mặc định (Vườn Của Tôi)
 *
 * Hiển thị tổng quan diện tích, bộ lọc cây trồng và danh sách thẻ thửa đất
 * với hình học đa giác thực tế (Real Polygon SVG) & kích thước đầy đủ.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../@core/context/ThemeContext';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { FieldCardPro } from '../components/FieldCardPro';
import { MOCK_MOBILE_FIELDS } from '../__mocks__/mockFieldsGeoJSON';
import { useMobileFieldStore } from '../store/useMobileFieldStore';

const FILTER_TAGS = ['Tất cả', '🌾 Lúa', '☕ Cà phê', '🍈 Sầu riêng', '🌿 Hồ tiêu'];

export function FarmOverviewTab() {
  const { colors, themeMode } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { fields, fetchFields, isLoadingFields } = useMobileFieldStore();

  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFields();
    setRefreshing(false);
  };

  // Combine backend fields or fallback to realistic mock fields
  const displayFields = fields && fields.length > 0 ? fields : MOCK_MOBILE_FIELDS;

  const filteredFields = displayFields.filter((f) => {
    if (activeFilter === 'Tất cả') return true;
    if (activeFilter.includes('Lúa') && f.crop_type?.toLowerCase().includes('lúa')) return true;
    if (activeFilter.includes('Cà phê') && f.crop_type?.toLowerCase().includes('cà phê')) return true;
    if (activeFilter.includes('Sầu riêng') && f.crop_type?.toLowerCase().includes('sầu riêng')) return true;
    if (activeFilter.includes('Hồ tiêu') && f.crop_type?.toLowerCase().includes('tiêu')) return true;
    return false;
  });

  const totalAreaHa = displayFields.reduce((sum, f) => sum + (parseFloat(f.area) || 1), 0).toFixed(2);
  const totalAreaM2 = (parseFloat(totalAreaHa) * 10000).toLocaleString('vi-VN');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing || isLoadingFields} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Farmer Greeting & Offline Sync HUD */}
      <View style={[styles.greetingCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <View style={styles.greetingHeader}>
          <View>
            <Text style={[styles.kickerText, { color: colors.primary }]}>
              ● TRỰC TUYẾN NGOẠI TUYẾN // ON-DEVICE
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              Chào {user?.fullName || user?.name || 'Bác Nông Dân'} 🌾
            </Text>
          </View>

          <Pressable
            style={[styles.quickScanTopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/camera_placeholder')}
          >
            <Text style={styles.quickScanTopText}>📸 Quét Lá</Text>
          </Pressable>
        </View>

        {/* Total Agronomic Metrics Bar */}
        <View style={[styles.kpiRow, { borderTopColor: colors.borderLight }]}>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNum, { color: colors.textPrimary }]}>{displayFields.length}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>THỬA ĐẤT</Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNum, { color: colors.primary }]}>{totalAreaHa} ha</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{totalAreaM2} m²</Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNum, { color: colors.accent }]}>98.4%</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>ĐỘ AN TOÀN</Text>
          </View>
        </View>
      </View>

      {/* Filter Chips Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {FILTER_TAGS.map((tag, idx) => {
            const isActive = activeFilter === tag;
            return (
              <Pressable
                key={idx}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surfaceCard,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveFilter(tag)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isActive ? '#06090E' : colors.textPrimary,
                      fontWeight: isActive ? '900' : '700',
                    },
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Danh Sách Thửa Đất ({filteredFields.length})
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
          Hình dạng & Kích thước thật
        </Text>
      </View>

      {/* Real Geometry Field Cards */}
      {filteredFields.map((field) => (
        <FieldCardPro
          key={field.id}
          field={field}
          onPress={(f) => router.push(`/field-detail/${f.id}`)}
          onScanPress={(f) => router.push('/camera_placeholder')}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  greetingCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kickerText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
  },
  quickScanTopBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quickScanTopText: {
    color: '#06090E',
    fontSize: 13,
    fontWeight: '900',
  },

  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
  },
  kpiNum: {
    fontSize: 16,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  filterScroll: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12.5,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FarmOverviewTab;
