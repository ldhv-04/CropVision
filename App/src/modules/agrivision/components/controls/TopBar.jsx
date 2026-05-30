import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const LAYERS = [
  { key: 'disease', label: 'Disease', icon: '🦠' },
  { key: 'moisture', label: 'Moisture', icon: '💧' },
  { key: 'ph', label: 'pH', icon: '⚗' },
  { key: 'nitrogen', label: 'Nitrogen', icon: '🧪' },
  { key: 'temperature', label: 'Temp', icon: '🌡' },
];

/**
 * TopBar — Field selector + Layer switcher + View toggle + Quick actions.
 *
 * Positioned at the top of the FieldMapScreen.
 */
export default function TopBar({
  fieldOptions = [],
  selectedFieldId,
  onFieldSelect,
  activeLayer,
  onLayerChange,
  statusCounts = {},
  viewMode = 'map',
  onViewModeChange,
}) {
  return (
    <View style={styles.container}>
      {/* Field Selector + View Toggle */}
      <View style={styles.fieldRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldScroll}>
          {fieldOptions.map((field) => (
            <TouchableOpacity
              key={field.value}
              style={[
                styles.fieldChip,
                field.value === selectedFieldId && styles.fieldChipActive,
              ]}
              onPress={() => onFieldSelect(field.value)}
            >
              <Text style={[
                styles.fieldChipText,
                field.value === selectedFieldId && styles.fieldChipTextActive,
              ]}>
                {field.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Map/List View Toggle */}
        {onViewModeChange && (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === 'map' && styles.viewBtnActive]}
              onPress={() => onViewModeChange('map')}
            >
              <Text style={styles.viewBtnText}>🗺</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
              onPress={() => onViewModeChange('list')}
            >
              <Text style={styles.viewBtnText}>☰</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status badges */}
        <View style={styles.statusBadges}>
          {statusCounts.HEALTHY > 0 && (
            <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.badgeText}>{statusCounts.HEALTHY}</Text>
            </View>
          )}
          {statusCounts.WARNING > 0 && (
            <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.badgeText}>{statusCounts.WARNING}</Text>
            </View>
          )}
          {statusCounts.INFECTED > 0 && (
            <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.badgeText}>{statusCounts.INFECTED}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Layer Switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layerRow}>
        {LAYERS.map((layer) => (
          <TouchableOpacity
            key={layer.key}
            style={[
              styles.layerChip,
              layer.key === activeLayer && styles.layerChipActive,
            ]}
            onPress={() => onLayerChange(layer.key)}
          >
            <Text style={styles.layerIcon}>{layer.icon}</Text>
            <Text style={[
              styles.layerText,
              layer.key === activeLayer && styles.layerTextActive,
            ]}>
              {layer.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  fieldScroll: {
    flex: 1,
  },
  fieldChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  fieldChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  fieldChipTextActive: {
    color: '#10b981',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  layerRow: {
    paddingHorizontal: 12,
  },
  layerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    marginRight: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  layerChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  layerIcon: {
    fontSize: 12,
  },
  layerText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  layerTextActive: {
    color: '#818cf8',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 8,
    marginLeft: 8,
    overflow: 'hidden',
  },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  viewBtnText: {
    fontSize: 14,
  },
});
