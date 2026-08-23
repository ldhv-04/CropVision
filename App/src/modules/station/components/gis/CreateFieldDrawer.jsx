/**
 * CreateFieldDrawer — Tactical Sector Vector Creation Drawer
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import CoordinateEntry from './CoordinateEntry';
import RadiusGenerator from './RadiusGenerator';
import {
  extractPolygonCoords,
  calculateAreaHectares,
  calculateCentroid,
  formatArea,
  formatCoords,
  toGeoJsonPolygon,
  isSelfIntersecting,
} from '../../utils/fieldGeometry';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

const CROP_OPTIONS = ['rice', 'corn', 'vegetables', 'fruit', 'coffee', 'tea', 'rubber', 'other'];
const GROWTH_OPTIONS = ['germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest', 'dormant'];
const COLOR_OPTIONS = [
  TACTICAL_THEME.radar,
  TACTICAL_THEME.satellite,
  TACTICAL_THEME.telemetry,
  TACTICAL_THEME.alert,
  TACTICAL_THEME.violet,
  '#38BDF8',
  '#FB923C',
  '#F472B6',
];

const TABS = [
  { id: 'draw', label: '✏️ VECTOR DRAW', desc: 'Click map vertices' },
  { id: 'coords', label: '📐 GPS TABLE', desc: 'Enter coordinates' },
  { id: 'radius', label: '⭕ RADIUS FIX', desc: 'Center + Radius' },
];

export default function CreateFieldDrawer({
  activeTab,
  onTabChange,
  drawVertices,
  onSave,
  onCancel,
  isSaving,
}) {
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('rice');
  const [growthStage, setGrowthStage] = useState('germination');
  const [plantingDate, setPlantingDate] = useState('');
  const [color, setColor] = useState(TACTICAL_THEME.radar);
  const [notes, setNotes] = useState('');

  const [coordVertices, setCoordVertices] = useState([]);
  const [generatedBoundary, setGeneratedBoundary] = useState(null);

  const activeVertices = useMemo(() => {
    if (activeTab === 'draw') return drawVertices;
    if (activeTab === 'coords') return coordVertices;
    if (activeTab === 'radius' && generatedBoundary) {
      return extractPolygonCoords(generatedBoundary);
    }
    return [];
  }, [activeTab, drawVertices, coordVertices, generatedBoundary]);

  const area = useMemo(() => calculateAreaHectares(activeVertices), [activeVertices]);
  const centroid = useMemo(() => calculateCentroid(activeVertices), [activeVertices]);

  const canSave = activeVertices.length >= 3 && name.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;

    if (isSelfIntersecting(activeVertices)) {
      if (Platform.OS === 'web') {
        window.alert('Warning: Polygon crosses itself. Please adjust vertices.');
      } else {
        Alert.alert('Warning', 'Polygon crosses itself. Please adjust vertices.');
      }
      return;
    }

    const boundary =
      activeTab === 'radius' && generatedBoundary
        ? generatedBoundary
        : toGeoJsonPolygon(activeVertices);

    onSave({
      name: name.trim(),
      crop_type: cropType,
      growth_stage: growthStage,
      planting_date: plantingDate || null,
      color,
      notes: notes.trim() || null,
      boundary,
      area,
      latitude: centroid[0],
      longitude: centroid[1],
    });
  }, [canSave, activeVertices, name, cropType, growthStage, plantingDate, color, notes, area, centroid, activeTab, generatedBoundary, onSave]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: TACTICAL_THEME.radar, fontFamily: TACTICAL_THEME.fontMono, letterSpacing: '1px' }}>
            VECTOR REGISTRATION
          </div>
          <Text style={styles.title}>CREATE NEW SECTOR</Text>
        </div>
        <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Tab Selector */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => onTabChange(tab.id)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              <Text style={[styles.tabDesc, activeTab === tab.id && styles.tabDescActive]}>
                {tab.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'coords' && (
          <CoordinateEntry vertices={coordVertices} onChange={setCoordVertices} />
        )}
        {activeTab === 'radius' && (
          <RadiusGenerator onGenerate={setGeneratedBoundary} />
        )}
        {activeTab === 'draw' && (
          <View style={styles.drawHint}>
            <Text style={styles.drawHintIcon}>✏️</Text>
            <Text style={styles.drawHintText}>
              {drawVertices.length === 0
                ? 'CLICK ON GIS MAP CANVAS TO PLACE POLYGON VERTICES.'
                : `[${drawVertices.length} VERTICES PLACED] ${drawVertices.length >= 3 ? 'Click "Finish Drawing" or snap to start vertex.' : 'Add at least 3 vertices to form sector polygon.'}`}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Summary (if polygon exists) */}
        {activeVertices.length >= 3 && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SECTOR EXTENT:</Text>
              <Text style={styles.summaryValue}>{formatArea(area)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VERTEX NODES:</Text>
              <Text style={styles.summaryValue}>{activeVertices.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CENTROID GPS:</Text>
              <Text style={styles.summaryValueMono}>{formatCoords(centroid[0], centroid[1])}</Text>
            </View>
          </View>
        )}

        {/* Field Details Form */}
        <Text style={styles.formTitle}>SECTOR ATTRIBUTES</Text>

        {/* Name */}
        <Text style={styles.label}>SECTOR IDENTIFIER / NAME *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. North Paddy Sector A4"
          placeholderTextColor={TACTICAL_THEME.textMuted}
          value={name}
          onChangeText={setName}
        />

        {/* Crop Type */}
        <Text style={styles.label}>CROP TAXONOMY</Text>
        <View style={styles.chipRow}>
          {CROP_OPTIONS.map((crop) => (
            <TouchableOpacity
              key={crop}
              style={[styles.chip, cropType === crop && styles.chipActive]}
              onPress={() => setCropType(crop)}
            >
              <Text style={[styles.chipText, cropType === crop && styles.chipTextActive]}>
                {crop.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Growth Stage */}
        <Text style={styles.label}>PHENOLOGICAL STAGE</Text>
        <View style={styles.chipRow}>
          {GROWTH_OPTIONS.map((stage) => (
            <TouchableOpacity
              key={stage}
              style={[styles.chip, growthStage === stage && styles.chipActive]}
              onPress={() => setGrowthStage(stage)}
            >
              <Text style={[styles.chipText, growthStage === stage && styles.chipTextActive]}>
                {stage.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Planting Date */}
        <Text style={styles.label}>CULTIVATION START DATE</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={TACTICAL_THEME.textMuted}
          value={plantingDate}
          onChangeText={setPlantingDate}
        />

        {/* Color Marker */}
        <Text style={styles.label}>SECTOR VECTOR COLOR ACCENT</Text>
        <View style={styles.colorRow}>
          {COLOR_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorActive]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.label}>AGRONOMIST OBSERVATIONS</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter soil telemetry, variety notes, or pest notes..."
          placeholderTextColor={TACTICAL_THEME.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>ABORT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || isSaving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          <Text style={styles.saveText}>
            {isSaving ? 'REGISTERING...' : '⚡ REGISTER SECTOR'}
          </Text>
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
    width: 340,
    backgroundColor: TACTICAL_THEME.bgPanelSolid,
    borderLeftWidth: 1,
    borderLeftColor: TACTICAL_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 1100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: TACTICAL_THEME.border,
    backgroundColor: 'rgba(6, 9, 14, 0.4)',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: TACTICAL_THEME.textPrimary,
    fontFamily: TACTICAL_THEME.fontMono,
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
  body: {
    flex: 1,
    padding: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
  },
  tabActive: {
    borderColor: TACTICAL_THEME.radar,
    backgroundColor: 'rgba(0, 245, 160, 0.1)',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: TACTICAL_THEME.textSecondary,
    fontFamily: TACTICAL_THEME.fontMono,
  },
  tabLabelActive: {
    color: TACTICAL_THEME.radar,
  },
  tabDesc: {
    fontSize: 7.5,
    color: TACTICAL_THEME.textMuted,
    marginTop: 2,
  },
  tabDescActive: {
    color: TACTICAL_THEME.radar,
  },
  drawHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 245, 160, 0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 160, 0.2)',
    gap: 8,
  },
  drawHintIcon: {
    fontSize: 14,
  },
  drawHintText: {
    flex: 1,
    fontSize: 10,
    color: TACTICAL_THEME.radar,
    fontFamily: TACTICAL_THEME.fontMono,
    lineHeight: 14,
  },
  divider: {
    height: 1,
    backgroundColor: TACTICAL_THEME.borderSubtle,
    marginVertical: 14,
  },
  summaryBox: {
    backgroundColor: 'rgba(0, 210, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: TACTICAL_THEME.textMuted,
    fontFamily: TACTICAL_THEME.fontMono,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '800',
    color: TACTICAL_THEME.satellite,
    fontFamily: TACTICAL_THEME.fontMono,
  },
  summaryValueMono: {
    fontSize: 9.5,
    color: TACTICAL_THEME.satellite,
    fontFamily: TACTICAL_THEME.fontMono,
  },
  formTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: TACTICAL_THEME.textMuted,
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: TACTICAL_THEME.textSecondary,
    fontFamily: TACTICAL_THEME.fontMono,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: TACTICAL_THEME.textPrimary,
    backgroundColor: TACTICAL_THEME.bgInput,
    fontFamily: TACTICAL_THEME.fontFamily,
  },
  textArea: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  chipActive: {
    borderColor: TACTICAL_THEME.radar,
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
  },
  chipText: {
    fontSize: 9,
    color: TACTICAL_THEME.textSecondary,
    fontWeight: '700',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  chipTextActive: {
    color: TACTICAL_THEME.radar,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorActive: {
    borderColor: '#ffffff',
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  actions: {
    flexDirection: 'row',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: TACTICAL_THEME.border,
    backgroundColor: 'rgba(6, 9, 14, 0.6)',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: TACTICAL_THEME.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: TACTICAL_THEME.fontMono,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 9,
    borderRadius: 4,
    backgroundColor: TACTICAL_THEME.radar,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TACTICAL_THEME.radar,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(0, 245, 160, 0.2)',
    shadowOpacity: 0,
  },
  saveText: {
    color: '#06090E',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: 0.5,
  },
});
