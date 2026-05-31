/**
 * LayerControls — Floating map layer switcher (top-right).
 *
 * Toggles: Base map (OSM/Satellite/Terrain), overlay layers, opacity.
 * Also includes Administrative Boundary Layer toggles for province/district/ward.
 */

import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Switch } from 'react-native';

const BASE_MAPS = [
  { id: 'osm', label: 'OSM', icon: '🗺️' },
  { id: 'satellite', label: 'Satellite', icon: '🛰️' },
  { id: 'terrain', label: 'Terrain', icon: '⛰️' },
];

const OVERLAYS = [
  { id: 'fields', label: 'Field Boundaries', icon: '📐' },
  { id: 'zones', label: 'Sub-Zones', icon: '🔲' },
  { id: 'sensors', label: 'IoT Sensors', icon: '📡' },
  { id: 'heatmap', label: 'Heatmap', icon: '🌡️' },
];

const ADMIN_LAYERS = [
  {
    id: 'province',
    label: 'Tỉnh/Thành phố',
    labelEN: 'Province',
    icon: '🗺️',
    color: '#E65100',
  },
  {
    id: 'district',
    label: 'Huyện/Quận',
    labelEN: 'District',
    icon: '🔶',
    color: '#1565C0',
  },
  {
    id: 'ward',
    label: 'Xã/Phường',
    labelEN: 'Ward',
    icon: '🔷',
    color: '#2E7D32',
    note: '~30MB',
  },
];

export default function LayerControls({ layers, adminLayers, onLayerChange, onAdminLayerToggle }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => setIsExpanded((v) => !v), []);

  return (
    <View style={styles.container}>
      {/* Toggle button */}
      <TouchableOpacity style={styles.toggleBtn} onPress={toggleExpand}>
        <Text style={styles.toggleIcon}>🗂️</Text>
        <Text style={styles.toggleLabel}>Layers</Text>
      </TouchableOpacity>

      {/* Expanded panel */}
      {isExpanded && (
        <View style={styles.panel}>
          {/* Base Maps */}
          <Text style={styles.sectionTitle}>Base Map</Text>
          {BASE_MAPS.map((bm) => (
            <TouchableOpacity
              key={bm.id}
              style={[styles.baseMapOption, layers.baseMap === bm.id && styles.baseMapActive]}
              onPress={() => onLayerChange('baseMap', bm.id)}
            >
              <Text style={styles.baseMapIcon}>{bm.icon}</Text>
              <Text
                style={[
                  styles.baseMapLabel,
                  layers.baseMap === bm.id && styles.baseMapLabelActive,
                ]}
              >
                {bm.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Overlay Layers */}
          <Text style={styles.sectionTitle}>Overlays</Text>
          {OVERLAYS.map((overlay) => (
            <View key={overlay.id} style={styles.overlayRow}>
              <Text style={styles.overlayIcon}>{overlay.icon}</Text>
              <Text style={styles.overlayLabel}>{overlay.label}</Text>
              <Switch
                value={layers[overlay.id]}
                onValueChange={(val) => onLayerChange(overlay.id, val)}
                trackColor={{ false: '#ccc', true: '#90CAF9' }}
                thumbColor={layers[overlay.id] ? '#1976D2' : '#f4f3f4'}
                style={styles.switch}
              />
            </View>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Administrative Boundary Layers */}
          <Text style={styles.sectionTitle}>Ranh giới hành chính</Text>
          {ADMIN_LAYERS.map((layer) => {
            const isEnabled = adminLayers?.[layer.id] ?? false;
            return (
              <View key={layer.id} style={styles.overlayRow}>
                <View style={[styles.adminDot, { backgroundColor: layer.color }]} />
                <View style={styles.adminLabelContainer}>
                  <Text style={styles.overlayLabel}>{layer.label}</Text>
                  {layer.note && (
                    <Text style={styles.adminNote}>{layer.note}</Text>
                  )}
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={() => onAdminLayerToggle && onAdminLayerToggle(layer.id)}
                  trackColor={{ false: '#ccc', true: `${layer.color}44` }}
                  thumbColor={isEnabled ? layer.color : '#f4f3f4'}
                  style={styles.switch}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleIcon: { fontSize: 16, marginRight: 6 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  panel: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  baseMapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 2,
  },
  baseMapActive: {
    backgroundColor: '#E3F2FD',
  },
  baseMapIcon: { fontSize: 16, marginRight: 8 },
  baseMapLabel: { fontSize: 13, color: '#444' },
  baseMapLabelActive: { color: '#1565C0', fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  overlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  overlayIcon: { fontSize: 14, marginRight: 8, width: 20, textAlign: 'center' },
  overlayLabel: { flex: 1, fontSize: 13, color: '#444' },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  // Admin layer specific
  adminDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  adminLabelContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  adminNote: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 1,
  },
});