/**
 * FieldDetailPanel — Tactical Cadastral Dossier Panel
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { extractPolygonCoords, calculateAreaHectares, calculateCentroid, formatArea, formatCoords } from '../../utils/fieldGeometry';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';
import { styles } from './FieldDetailPanelStyles';

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
