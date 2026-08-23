/**
 * ZoneEditorPage (Native Android/iOS Fallback)
 *
 * The detailed multi-polygon Zone Editor is designed for Desktop/Web.
 * On native mobile, a clean fallback card is rendered without importing maplibre-gl.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

export default function ZoneEditorPageNative({ onBack, fieldName }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>TRÌNH CHỈNH SỬA PHÂN KHU</Text>
        <Text style={styles.subtitle}>
          Tính năng chỉnh sửa đa giác phân khu ({fieldName || 'Thửa đất'}) được thiết kế tối ưu trên máy tính / Web Station để đảm bảo độ chính xác tọa độ cao nhất.
        </Text>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>Quay Lại Bản Đồ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TACTICAL_THEME.bgCanvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: TACTICAL_THEME.bgSurface,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.borderMedium,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: TACTICAL_THEME.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: TACTICAL_THEME.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: TACTICAL_THEME.neonEmerald,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  backBtnText: {
    color: '#06090E',
    fontWeight: '900',
    fontSize: 13,
  },
});
