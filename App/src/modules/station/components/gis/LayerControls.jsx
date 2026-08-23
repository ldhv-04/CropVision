/**
 * LayerControls — Tactical Floating Map Layer HUD
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Switch } from 'react-native';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

const BASE_MAPS = [
  { id: 'osm', label: 'VECTOR STREETS', icon: '🗺️' },
  { id: 'satellite', label: 'SATELLITE RECON', icon: '🛰️' },
  { id: 'terrain', label: 'TOPOGRAPHIC', icon: '⛰️' },
];

const OVERLAYS = [
  { id: 'fields', label: 'Field Vectors', icon: '📐' },
  { id: 'zones', label: 'Cultivation Sub-Zones', icon: '🔲' },
  { id: 'sensors', label: 'IoT Telemetry Nodes', icon: '📡' },
  { id: 'heatmap', label: 'Spore Dispersion Heatmap', icon: '🌡️' },
];

const ADMIN_LAYERS = [
  {
    id: 'province',
    label: 'Tỉnh/Thành phố',
    labelEN: 'Province Boundary',
    icon: '🗺️',
    color: '#E65100',
  },
  {
    id: 'district',
    label: 'Huyện/Quận',
    labelEN: 'District Boundary',
    icon: '🔶',
    color: '#00D2FF',
  },
  {
    id: 'ward',
    label: 'Xã/Phường',
    labelEN: 'Ward Grid',
    icon: '🔷',
    color: '#00F5A0',
    note: '~30MB',
  },
];

export default function LayerControls({ layers, adminLayers, onLayerChange, onAdminLayerToggle }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => setIsExpanded((v) => !v), []);

  return (
    <View style={styles.container}>
      {/* Toggle HUD button */}
      <TouchableOpacity style={styles.toggleBtn} onPress={toggleExpand}>
        <Text style={styles.toggleIcon}>🗂️</Text>
        <Text style={styles.toggleLabel}>GEO-LAYERS</Text>
      </TouchableOpacity>

      {/* Expanded tactical panel */}
      {isExpanded && (
        <View style={styles.panel}>
          {/* Base Maps */}
          <Text style={styles.sectionTitle}>BASE VECTOR RASTER</Text>
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
          <Text style={styles.sectionTitle}>TACTICAL OVERLAYS</Text>
          {OVERLAYS.map((overlay) => (
            <View key={overlay.id} style={styles.overlayRow}>
              <Text style={styles.overlayIcon}>{overlay.icon}</Text>
              <Text style={styles.overlayLabel}>{overlay.label}</Text>
              <Switch
                value={layers[overlay.id]}
                onValueChange={(val) => onLayerChange(overlay.id, val)}
                trackColor={{ false: '#1E293B', true: 'rgba(0, 245, 160, 0.4)' }}
                thumbColor={layers[overlay.id] ? TACTICAL_THEME.radar : '#64748B'}
                style={styles.switch}
              />
            </View>
          ))}

          {/* Administrative Layers */}
          {adminLayers && onAdminLayerToggle && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>ADMIN JURISDICTION (VN)</Text>
              {ADMIN_LAYERS.map((al) => (
                <View key={al.id} style={styles.overlayRow}>
                  <Text style={styles.overlayIcon}>{al.icon}</Text>
                  <Text style={styles.overlayLabel}>
                    {al.label} {al.note && <Text style={styles.note}>{al.note}</Text>}
                  </Text>
                  <Switch
                    value={adminLayers[al.id]}
                    onValueChange={() => onAdminLayerToggle(al.id)}
                    trackColor={{ false: '#1E293B', true: 'rgba(0, 210, 255, 0.4)' }}
                    thumbColor={adminLayers[al.id] ? TACTICAL_THEME.satellite : '#64748B'}
                    style={styles.switch}
                  />
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 19, 32, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    gap: 6,
  },
  toggleIcon: { fontSize: 13 },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: TACTICAL_THEME.radar,
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: 1,
  },
  panel: {
    marginTop: 8,
    backgroundColor: TACTICAL_THEME.bgPanelSolid,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    padding: 12,
    width: 230,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: TACTICAL_THEME.textMuted,
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: 1,
    marginBottom: 6,
  },
  baseMapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
    gap: 8,
  },
  baseMapActive: {
    backgroundColor: 'rgba(0, 245, 160, 0.1)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.radar,
  },
  baseMapIcon: { fontSize: 12 },
  baseMapLabel: {
    fontSize: 10,
    color: TACTICAL_THEME.textSecondary,
    fontFamily: TACTICAL_THEME.fontMono,
    fontWeight: '600',
  },
  baseMapLabelActive: {
    color: TACTICAL_THEME.radar,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: TACTICAL_THEME.borderSubtle,
    marginVertical: 8,
  },
  overlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  overlayIcon: { fontSize: 12, width: 20 },
  overlayLabel: {
    flex: 1,
    fontSize: 10,
    color: TACTICAL_THEME.textSecondary,
    fontFamily: TACTICAL_THEME.fontFamily,
    fontWeight: '500',
  },
  note: {
    fontSize: 8,
    color: TACTICAL_THEME.textMuted,
    fontFamily: TACTICAL_THEME.fontMono,
  },
  switch: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
  },
});
