/**
 * FieldCardPro — Thẻ thửa đất tối giản cho nông dân
 *
 * Tích hợp hình học đa giác thực tế (FieldPolygonThumbnail),
 * diện tích đầy đủ (ha / m²), phân khu canh tác và trạng thái nấm bệnh.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../@core/context/ThemeContext';
import { FieldPolygonThumbnail } from './FieldPolygonThumbnail';

export function FieldCardPro({ field, onPress, onScanPress }) {
  const { colors } = useTheme();

  const isAlert = field.health_status === 'WARNING' || field.health_status === 'INFECTED';
  const areaHa = field.area ? parseFloat(field.area).toFixed(2) : '1.00';
  const areaM2 = field.area_m2 ? field.area_m2.toLocaleString('vi-VN') : (parseFloat(areaHa) * 10000).toLocaleString('vi-VN');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: isAlert ? colors.dangerBorder : colors.border,
        },
        pressed && { opacity: 0.88 },
      ]}
      onPress={() => onPress?.(field)}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.cropBadgeRow}>
          <Text style={styles.cropIcon}>{field.crop_icon || '🌿'}</Text>
          <View>
            <Text style={[styles.fieldName, { color: colors.textPrimary }]}>
              {field.name}
            </Text>
            <Text style={[styles.cropType, { color: colors.textSecondary }]}>
              {field.crop_type} · {field.location_name || 'Vườn chính'}
            </Text>
          </View>
        </View>

        {/* Health status badge */}
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: isAlert ? colors.dangerBg : colors.successBg,
            borderColor: isAlert ? colors.dangerBorder : colors.primaryBorder,
          }
        ]}>
          <Text style={[
            styles.statusText,
            { color: isAlert ? colors.danger : colors.primary }
          ]}>
            {isAlert ? '⚠️ ' + field.health_label : '✓ ' + (field.health_label || 'Khỏe mạnh')}
          </Text>
        </View>
      </View>

      {/* Main Body: Real Polygon SVG + Dimension Specs */}
      <View style={styles.bodyRow}>
        {/* Left: Real SVG Geometry Preview */}
        <FieldPolygonThumbnail
          boundary={field.boundary}
          width={105}
          height={90}
          isAlert={isAlert}
        />

        {/* Right: Explicit Dimensions & Agronomic Specs */}
        <View style={styles.specsColumn}>
          {/* Area */}
          <View style={styles.specItem}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>TỔNG DIỆN TÍCH</Text>
            <Text style={[styles.specValue, { color: colors.textPrimary }]}>
              {areaHa} ha <Text style={[styles.specSubValue, { color: colors.textSecondary }]}>({areaM2} m²)</Text>
            </Text>
          </View>

          {/* Growth Stage */}
          <View style={styles.specItem}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>GIAI ĐOẠN SINH TRƯỞNG</Text>
            <Text style={[styles.specGrowthValue, { color: colors.accent }]}>
              🌱 {field.growth_stage || 'Đang canh tác'}
            </Text>
          </View>

          {/* Zones count & update */}
          <View style={styles.specSubRow}>
            <Text style={[styles.subText, { color: colors.textMuted }]}>
              Phân khu: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{field.zones_count || 1} lô</Text>
            </Text>
            <Text style={[styles.subText, { color: colors.textMuted }]}>
              {field.updated_at || 'Cập nhật hôm nay'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Footer Button Bar */}
      <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtnSecondary,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => onPress?.(field)}
        >
          <Text style={[styles.actionBtnTextSec, { color: colors.textPrimary }]}>
            🗺️ Xem Phân Khu
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionBtnPrimary,
            { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => onScanPress?.(field)}
        >
          <Text style={styles.actionBtnTextPri}>
            📸 Quét Bệnh Tại Rẫy Này
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  cropBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cropIcon: {
    fontSize: 26,
  },
  fieldName: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  cropType: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  bodyRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  specsColumn: {
    flex: 1,
    gap: 6,
  },
  specItem: {},
  specLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  specSubValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  specGrowthValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  specSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  subText: {
    fontSize: 11.5,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtnSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTextSec: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    flex: 1.2,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTextPri: {
    color: '#06090E',
    fontSize: 13,
    fontWeight: '900',
  },
});

export default FieldCardPro;
