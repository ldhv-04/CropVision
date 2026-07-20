/**
 * CropVision Station Layout — Native Fallback
 *
 * This file is evaluated on native mobile platforms (Android/iOS).
 * It presents a safe fallback message without importing any web-only
 * components or browser-only dependencies (e.g. maplibre-gl).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DARK_COLORS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

export default function StationLayoutNative() {
  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackText}>⚠️ Station App is designed for Web/Desktop only.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DARK_COLORS.background,
    padding: 24,
  },
  fallbackText: {
    color: DARK_COLORS.primaryGlow,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});