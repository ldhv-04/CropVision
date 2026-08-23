/**
 * FieldDetailPanel — Tactical Cadastral Dossier Panel
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { extractPolygonCoords, calculateAreaHectares, calculateCentroid, formatArea, formatCoords } from '../../utils/fieldGeometry';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

const STATUS_BADGES = {
  ACTIVE: { bg: 'rgba(0, 245, 160, 0.15)', color: TACTICAL_THEME.radar, label: 'NOMINAL / ACTIVE' },
  INACTIVE: { bg: 'rgba(255, 255, 255, 0.05)', color: TACTICAL_THEME.textMuted, label: 'INACTIVE' },
  FALLOW: { bg: 'rgba(255, 179, 0, 0.15)', color: TACTICAL_THEME.telemetry, label: 'FALLOW CYCLE' },
};

const GROWTH_STAGES = [
  { id: 'germination', label: 'Germination', icon: '🌱' },
  { id: 'seedling', label: 'Seedling', icon: '🌿' },
  { id: 'vegetative', label: 'Vegetative', icon: '🪴' },
  { id: 'flowering', label: 'Flowering', icon: '🌸' },
  { id: 'fruiting', label: 'Fruiting', icon: '🍎' },
  { id: 'harvest', label: 'Harvest', icon: '🌾' },
  { id: 'dormant', label: 'Dormant', icon: '😴' },
];

export default function FieldDetailPanel({ field, onClose, onEdit, onDelete, onStartEditing, onConfigureZones }) {
  const coords = useMemo(() => extractPolygonCoords(field.boundary), [field.boundary]);
  const area = useMemo(() => calculateAreaHectares(coords), [coords]);
  const centroid = useMemo(() => calculateCentroid(coords), [coords]);
  const badge = STATUS_BADGES[field.status] || STATUS_BADGES.ACTIVE;
  const growthInfo = GROWTH_STAGES.find((g) => g.id === field.growth_stage) || GROWTH_STAGES[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>SECTOR DOSSIER</Text>
            <Text style={styles.fieldName} numberOfLines={1}>{field.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={styles.cropLabel}>🌱 {field.crop_type || 'Rice'}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{formatArea(area)}</Text>
            <Text style={styles.kpiLabel}>AREA EXTENT</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: TACTICAL_THEME.satellite }]}>{coords.length}</Text>
            <Text style={styles.kpiLabel}>VERTICES</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{growthInfo.icon}</Text>
            <Text style={styles.kpiLabel}>{growthInfo.label.toUpperCase()}</Text>
          </View>
        </View>

        {/* Centroid Coordinates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CENTROID GPS COORDINATES</Text>
          <View style={styles.coordBox}>
            <Text style={styles.coordText}>{formatCoords(centroid[0], centroid[1])}</Text>
          </View>
        </View>

        {/* Growth Stage Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PHENOLOGICAL PHASES</Text>
          <View style={styles.timeline}>
            {GROWTH_STAGES.map((stage, i) => {
              const isActive = stage.id === field.growth_stage;
              const currentIdx = GROWTH_STAGES.findIndex((g) => g.id === field.growth_stage);
              const isPast = i < currentIdx;
              return (
                <View key={stage.id} style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      isActive && styles.timelineDotActive,
                      isPast && styles.timelineDotPast,
                    ]}
                  >
                    <Text style={styles.timelineIcon}>{stage.icon}</Text>
                  </View>
                  <Text
                    style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}
                    numberOfLines={1}
                  >
                    {stage.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Planting Date */}
        {field.planting_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CULTIVATION START</Text>
            <Text style={styles.detailText}>📅 {field.planting_date}</Text>
          </View>
        )}

        {/* Notes */}
        {field.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SCOUT OBSERVATIONS</Text>
            <Text style={styles.detailText}>{field.notes}</Text>
          </View>
        )}

        {/* Created */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTERED AT</Text>
          <Text style={styles.detailText}>
            {field.created_at ? new Date(field.created_at).toLocaleString('vi-VN') : '—'}
          </Text>
        </View>
      </ScrollView>

      {/* Actions HUD */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={onStartEditing}>
          <Text style={styles.editBtnText}>✏️ EDIT BOUNDARY VECTORS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zonesBtn} onPress={onConfigureZones}>
          <Text style={styles.zonesBtnText}>🗺️ CONFIGURE CULTIVATION ZONES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>🗑️ PURGE SECTOR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 320,
    backgroundColor: TACTICAL_THEME.bgPanelSolid,
    borderLeftWidth: 1,
    borderLeftColor: TACTICAL_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1100,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: TACTICAL_THEME.border,
    backgroundColor: 'rgba(6, 9, 14, 0.4)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: TACTICAL_THEME.satellite,
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '800',
    color: TACTICAL_THEME.textPrimary,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 12,
    color: TACTICAL_THEME.textSecondary,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  cropLabel: {
    fontSize: 11,
    color: TACTICAL_THEME.textSecondary,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: TACTICAL_THEME.radar,
    fontFamily: TACTICAL_THEME.fontMono,
  },
  kpiLabel: {
    fontSize: 8,
    color: TACTICAL_THEME.textMuted,
    marginTop: 2,
    fontWeight: '700',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: TACTICAL_THEME.textMuted,
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: 1,
    marginBottom: 6,
  },
  coordBox: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 210, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
  },
  coordText: {
    fontSize: 11,
    color: TACTICAL_THEME.satellite,
    fontFamily: TACTICAL_THEME.fontMono,
    fontWeight: '700',
  },
  detailText: {
    fontSize: 12,
    color: TACTICAL_THEME.textSecondary,
    lineHeight: 18,
  },
  timeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  timelineItem: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  timelineDotActive: {
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    borderColor: TACTICAL_THEME.radar,
  },
  timelineDotPast: {
    backgroundColor: 'rgba(0, 245, 160, 0.05)',
  },
  timelineIcon: {
    fontSize: 12,
  },
  timelineLabel: {
    fontSize: 7.5,
    color: TACTICAL_THEME.textMuted,
    textAlign: 'center',
  },
  timelineLabelActive: {
    color: TACTICAL_THEME.radar,
    fontWeight: '700',
  },
  actions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: TACTICAL_THEME.border,
    backgroundColor: 'rgba(6, 9, 14, 0.6)',
    gap: 8,
  },
  editBtn: {
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.satellite,
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  editBtnText: {
    color: TACTICAL_THEME.satellite,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  zonesBtn: {
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    borderWidth: 1,
    borderColor: TACTICAL_THEME.radar,
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  zonesBtnText: {
    color: TACTICAL_THEME.radar,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 46, 84, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 46, 84, 0.3)',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: TACTICAL_THEME.alert,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TACTICAL_THEME.fontMono,
  },
});
