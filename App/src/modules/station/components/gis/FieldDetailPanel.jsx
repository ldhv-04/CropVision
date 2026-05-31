/**
 * FieldDetailPanel — Right side panel showing field details.
 *
 * Shows: field header, KPI mini-cards, growth stage, recent activities,
 * and quick action buttons (Edit, Delete, View Zones).
 */

import React, { useMemo, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { extractPolygonCoords, calculateAreaHectares, calculateCentroid, formatArea, formatCoords } from '../../utils/fieldGeometry';

const STATUS_BADGES = {
  ACTIVE: { bg: '#E8F5E9', color: '#2E7D32', label: 'Active' },
  INACTIVE: { bg: '#F5F5F5', color: '#616161', label: 'Inactive' },
  FALLOW: { bg: '#EFEBE9', color: '#5D4037', label: 'Fallow' },
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

export default function FieldDetailPanel({ field, onClose, onEdit, onDelete, onStartEditing }) {
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
          <Text style={styles.fieldName} numberOfLines={1}>{field.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={styles.cropLabel}>🌱 {field.crop_type}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{formatArea(area)}</Text>
            <Text style={styles.kpiLabel}>Area</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{coords.length}</Text>
            <Text style={styles.kpiLabel}>Vertices</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{growthInfo.icon}</Text>
            <Text style={styles.kpiLabel}>{growthInfo.label}</Text>
          </View>
        </View>

        {/* Centroid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Center Point</Text>
          <Text style={styles.coordText}>{formatCoords(centroid[0], centroid[1])}</Text>
        </View>

        {/* Growth Stage Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Stage</Text>
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
            <Text style={styles.sectionTitle}>Planting Date</Text>
            <Text style={styles.detailText}>📅 {field.planting_date}</Text>
          </View>
        )}

        {/* Notes */}
        {field.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.detailText}>{field.notes}</Text>
          </View>
        )}

        {/* Created */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created</Text>
          <Text style={styles.detailText}>
            {field.created_at ? new Date(field.created_at).toLocaleDateString() : '—'}
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={onStartEditing}>
          <Text style={styles.editBtnText}>✏️ Edit Boundary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metadataBtn} onPress={onEdit}>
          <Text style={styles.metadataBtnText}>📝 Edit Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
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
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1100,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: '#666' },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cropLabel: { fontSize: 12, color: '#666' },
  body: { flex: 1, padding: 16 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kpiCard: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 8, padding: 10, alignItems: 'center' },
  kpiValue: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  kpiLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  coordText: { fontSize: 13, color: '#333', fontFamily: 'monospace' },
  detailText: { fontSize: 13, color: '#444', lineHeight: 20 },
  timeline: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  timelineItem: { alignItems: 'center', width: 42 },
  timelineDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  timelineDotActive: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#1976D2' },
  timelineDotPast: { backgroundColor: '#E8F5E9' },
  timelineIcon: { fontSize: 14 },
  timelineLabel: { fontSize: 8, color: '#999', textAlign: 'center' },
  timelineLabelActive: { color: '#1565C0', fontWeight: '600' },
  actions: { padding: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 8 },
  editBtn: { backgroundColor: '#1976D2', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  metadataBtn: { backgroundColor: '#F5F5F5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  metadataBtnText: { color: '#333', fontSize: 13, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#FFEBEE', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  deleteBtnText: { color: '#C62828', fontSize: 13, fontWeight: '600' },
});