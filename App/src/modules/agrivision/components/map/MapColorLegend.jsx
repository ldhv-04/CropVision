import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LAYER_LEGENDS } from '../../utils/colorScales';

/**
 * MapColorLegend — Persistent overlay showing the current color scale.
 *
 * Positioned in the bottom-right corner of the map.
 * Updates dynamically when the active layer changes.
 */
export default function MapColorLegend({ layer }) {
  const legend = LAYER_LEGENDS[layer];
  if (!legend) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{legend.label}</Text>

      {legend.type === 'discrete' ? (
        <View style={styles.discreteContainer}>
          {legend.stops.map((stop, i) => (
            <View key={i} style={styles.discreteRow}>
              <View style={[styles.colorDot, { backgroundColor: stop.color }]} />
              <Text style={styles.discreteLabel}>{stop.label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.continuousContainer}>
          <View style={styles.gradientBar}>
            {legend.gradient.map((color, i) => (
              <View
                key={i}
                style={[styles.gradientSegment, { backgroundColor: color }]}
              />
            ))}
          </View>
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeLabel}>{legend.min}{legend.unit}</Text>
            <Text style={styles.rangeLabel}>{legend.max}{legend.unit}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Discrete
  discreteContainer: {
    gap: 4,
  },
  discreteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  discreteLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
  // Continuous
  continuousContainer: {
    gap: 4,
  },
  gradientBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gradientSegment: {
    flex: 1,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    color: '#94a3b8',
    fontSize: 9,
  },
});