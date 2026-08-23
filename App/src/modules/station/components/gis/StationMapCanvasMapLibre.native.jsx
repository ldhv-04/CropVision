/**
 * StationMapCanvasMapLibre (Native Android/iOS version)
 *
 * Provides a clean, pure React Native map canvas for mobile platforms
 * without any browser-only DOM/WebGL/MapLibre-GL dependencies.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StationMapCanvas from './StationMapCanvas';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

export default function StationMapCanvasMapLibreNative(props) {
  // If StationMapCanvas is available, use it; otherwise render tactical fallback HUD
  return (
    <View style={styles.container}>
      <StationMapCanvas {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TACTICAL_THEME.bgCanvas,
  },
});
