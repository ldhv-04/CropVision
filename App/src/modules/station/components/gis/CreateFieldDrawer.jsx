/**
 * CreateFieldDrawer — Right side drawer for creating new fields.
 *
 * Three creation methods via tabs:
 * 1. Draw — User draws polygon on map
 * 2. Coordinates — Manual lat/lng entry table
 * 3. Center+Radius — Generate polygon from center point and radius
 *
 * Common field details form below the tab content.
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

const CROP_OPTIONS = ['rice', 'corn', 'vegetables', 'fruit', 'coffee', 'tea', 'rubber', 'other'];
const GROWTH_OPTIONS = ['germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest', 'dormant'];
const COLOR_OPTIONS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B'];

const TABS = [
  { id: 'draw', label: '✏️ Draw', desc: 'Click on map' },
  { id: 'coords', label: '📐 Coords', desc: 'Enter GPS' },
  { id: 'radius', label: '⭕ Center+R', desc: 'Circle gen' },
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
  const [color, setColor] = useState('#4CAF50');
  const [notes, setNotes] = useState('');

  // Coordinate entry state
  const [coordVertices, setCoordVertices] = useState([]);
  // Radius generator state
  const [generatedBoundary, setGeneratedBoundary] = useState(null);

  // Compute the active polygon vertices based on tab
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

    // Validate
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
        <Text style={styles.title}>Create Field</Text>
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
                ? 'Click on the map to start drawing a field boundary'
                : `${drawVertices.length} vertices placed. ${drawVertices.length >= 3 ? 'Click "Finish Drawing" or click the first vertex to close.' : 'Keep clicking to add more.'}`}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Summary (if polygon exists) */}
        {activeVertices.length >= 3 && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Area:</Text>
              <Text style={styles.summaryValue}>{formatArea(area)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vertices:</Text>
              <Text style={styles.summaryValue}>{activeVertices.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Center:</Text>
              <Text style={styles.summaryValueMono}>{formatCoords(centroid[0], centroid[1])}</Text>
            </View>
          </View>
        )}

        {/* Field Details Form */}
        <Text style={styles.formTitle}>Field Details</Text>

        {/* Name */}
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. North Paddy Field"
          placeholderTextColor="#bbb"
          value={name}
          onChangeText={setName}
        />

        {/* Crop Type */}
        <Text style={styles.label}>Crop Type</Text>
        <View style={styles.chipRow}>
          {CROP_OPTIONS.map((crop) => (
            <TouchableOpacity
              key={crop}
              style={[styles.chip, cropType === crop && styles.chipActive]}
              onPress={() => setCropType(crop)}
            >
              <Text style={[styles.chipText, cropType === crop && styles.chipTextActive]}>
                {crop}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Growth Stage */}
        <Text style={styles.label}>Growth Stage</Text>
        <View style={styles.chipRow}>
          {GROWTH_OPTIONS.map((stage) => (
            <TouchableOpacity
              key={stage}
              style={[styles.chip, growthStage === stage && styles.chipActive]}
              onPress={() => setGrowthStage(stage)}
            >
              <Text style={[styles.chipText, growthStage === stage && styles.chipTextActive]}>
                {stage}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Planting Date */}
        <Text style={styles.label}>Planting Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#bbb"
          value={plantingDate}
          onChangeText={setPlantingDate}
        />

        {/* Color */}
        <Text style={styles.label}>Color</Text>
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
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional notes..."
          placeholderTextColor="#bbb"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || isSaving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          <Text style={styles.saveText}>{isSaving ? 'Saving...' : '💾 Save Field'}</Text>
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
    width: 380,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: '#666' },
  body: { flex: 1, padding: 16 },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#E3F2FD' },
  tabLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  tabLabelActive: { color: '#1565C0' },
  tabDesc: { fontSize: 9, color: '#999', marginTop: 2 },
  tabDescActive: { color: '#64B5F6' },
  drawHint: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 12 },
  drawHintIcon: { fontSize: 24, marginRight: 10 },
  drawHintText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 12 },
  summaryBox: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 10, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: '#888' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#333' },
  summaryValueMono: { fontSize: 11, color: '#333', fontFamily: 'monospace' },
  formTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },
  chipText: { fontSize: 11, color: '#666' },
  chipTextActive: { color: '#1565C0', fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 8 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorActive: { borderColor: '#333', transform: [{ scale: 1.15 }] },
  actions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText: { fontSize: 13, color: '#666', fontWeight: '600' },
  saveBtn: { flex: 2, paddingVertical: 12, borderRadius: 8, backgroundColor: '#1976D2', alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#BDBDBD' },
  saveText: { fontSize: 13, color: '#fff', fontWeight: '600' },
});