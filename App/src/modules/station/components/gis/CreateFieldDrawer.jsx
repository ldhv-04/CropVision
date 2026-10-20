/**
 * CreateFieldDrawer — Tactical Sector Vector Creation Drawer.
 * Decomposed component conforming to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
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
  toGeoJsonPolygon,
  isSelfIntersecting,
} from '../../utils/fieldGeometry';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';
import { drawerStyles as styles } from './drawerStyles';

const CROP_OPTIONS = ['rice', 'corn', 'vegetables', 'fruit', 'coffee', 'tea', 'rubber', 'other'];
const TABS = [
  { id: 'draw', label: '✏️ VECTOR DRAW', desc: 'Click map vertices' },
  { id: 'coords', label: '📐 GPS TABLE', desc: 'Enter coordinates' },
  { id: 'radius', label: '⭕ RADIUS FIX', desc: 'Center + Radius' },
];

export default function CreateFieldDrawer({
  isOpen = true,
  activeTab = 'draw',
  onTabChange,
  drawnBoundary,
  drawVertices = [],
  onSave,
  onClose,
  onCancel,
  isSaving,
}) {
  const [tab, setTab] = useState(activeTab);
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('rice');
  const [coordVertices, setCoordVertices] = useState([]);
  const [generatedBoundary, setGeneratedBoundary] = useState(null);

  const activeVertices = useMemo(() => {
    if (drawnBoundary) return extractPolygonCoords(drawnBoundary);
    if (tab === 'draw') return drawVertices;
    if (tab === 'coords') return coordVertices;
    if (tab === 'radius' && generatedBoundary) return extractPolygonCoords(generatedBoundary);
    return [];
  }, [tab, drawnBoundary, drawVertices, coordVertices, generatedBoundary]);

  const area = useMemo(() => calculateAreaHectares(activeVertices), [activeVertices]);
  const centroid = useMemo(() => calculateCentroid(activeVertices), [activeVertices]);
  const canSave = activeVertices.length >= 3 && name.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    if (isSelfIntersecting(activeVertices)) {
      const msg = 'Polygon crosses itself. Please adjust vertices.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Warning', msg);
      return;
    }

    const boundary = tab === 'radius' && generatedBoundary ? generatedBoundary : toGeoJsonPolygon(activeVertices);
    onSave({
      name: name.trim(),
      cropType,
      boundary,
      area,
      latitude: centroid ? centroid[0] : 0,
      longitude: centroid ? centroid[1] : 0,
    });
  }, [canSave, activeVertices, tab, generatedBoundary, name, cropType, area, centroid, onSave]);

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VECTORIZE NEW SECTOR</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose || onCancel}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => {
                setTab(t.id);
                if (onTabChange) onTabChange(t.id);
              }}
            >
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'coords' && <CoordinateEntry onVerticesChange={setCoordVertices} />}
        {tab === 'radius' && <RadiusGenerator onBoundaryGenerated={setGeneratedBoundary} />}

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ESTIMATED AREA</Text>
            <Text style={styles.summaryValue}>{area > 0 ? `${area.toFixed(2)} ha` : 'N/A'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GEOMETRIC VERTICES</Text>
            <Text style={styles.summaryValue}>{activeVertices.length}</Text>
          </View>
        </View>

        <Text style={styles.label}>SECTOR CALLSIGN / NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sector Alpha 01"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>CROP CLASSIFICATION</Text>
        <View style={styles.chipRow}>
          {CROP_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, cropType === c && styles.chipActive]}
              onPress={() => setCropType(c)}
            >
              <Text style={[styles.chipText, cropType === c && styles.chipTextActive]}>
                {c.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose || onCancel}>
          <Text style={styles.cancelText}>ABORT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || isSaving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          <Text style={styles.saveText}>{isSaving ? 'REGISTERING...' : 'COMMIT SECTOR'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
