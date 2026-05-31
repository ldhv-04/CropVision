/**
 * RadiusGenerator — Center point + radius → polygon generator.
 *
 * Allows users to enter center lat/lng and radius in meters,
 * then generates an approximate polygon.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Platform } from 'react-native';
import {
  generateCirclePolygon,
  toGeoJsonPolygon,
  calculateAreaHectares,
  calculateCentroid,
  formatArea,
  formatCoords,
  isValidLatitude,
  isValidLongitude,
} from '../../utils/fieldGeometry';

const VERTEX_OPTIONS = [16, 24, 32, 48, 64];

export default function RadiusGenerator({ onGenerate }) {
  const [centerLat, setCenterLat] = useState('');
  const [centerLng, setCenterLng] = useState('');
  const [radius, setRadius] = useState('');
  const [vertices, setVertices] = useState(32);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleGenerate = useCallback(() => {
    const lat = parseFloat(centerLat);
    const lng = parseFloat(centerLng);
    const r = parseFloat(radius);

    if (!isValidLatitude(lat)) {
      setError('Invalid latitude (-90 to 90)');
      return;
    }
    if (!isValidLongitude(lng)) {
      setError('Invalid longitude (-180 to 180)');
      return;
    }
    if (isNaN(r) || r <= 0 || r > 50000) {
      setError('Radius must be 1-50000 meters');
      return;
    }

    setError('');
    const polygon = generateCirclePolygon(lat, lng, r, vertices);
    const boundary = toGeoJsonPolygon(polygon);
    setPreview({ boundary, vertices: polygon });
    onGenerate(boundary);
  }, [centerLat, centerLng, radius, vertices, onGenerate]);

  const previewArea = useMemo(() => {
    if (!preview) return 0;
    return calculateAreaHectares(preview.vertices);
  }, [preview]);

  const previewCentroid = useMemo(() => {
    if (!preview) return [0, 0];
    return calculateCentroid(preview.vertices);
  }, [preview]);

  return (
    <View style={styles.container}>
      {/* Center Point */}
      <Text style={styles.sectionTitle}>Center Point</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="10.823100"
            placeholderTextColor="#bbb"
            value={centerLat}
            onChangeText={setCenterLat}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="106.629700"
            placeholderTextColor="#bbb"
            value={centerLng}
            onChangeText={setCenterLng}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Radius */}
      <Text style={styles.sectionTitle}>Radius</Text>
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={styles.inputLabel}>Meters</Text>
          <TextInput
            style={styles.input}
            placeholder="200"
            placeholderTextColor="#bbb"
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Vertices</Text>
          <View style={styles.vertexRow}>
            {VERTEX_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.vertexBtn, vertices === v && styles.vertexBtnActive]}
                onPress={() => setVertices(v)}
              >
                <Text style={[styles.vertexText, vertices === v && styles.vertexTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
        <Text style={styles.generateText}>⭕ Generate Polygon</Text>
      </TouchableOpacity>

      {/* Error */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Preview */}
      {preview && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Generated Polygon</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Area:</Text>
            <Text style={styles.previewValue}>{formatArea(previewArea)}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Vertices:</Text>
            <Text style={styles.previewValue}>{preview.vertices.length}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Center:</Text>
            <Text style={styles.previewValueMono}>
              {formatCoords(previewCentroid[0], previewCentroid[1])}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={() => {
              setPreview(null);
              onGenerate(null);
            }}
          >
            <Text style={styles.regenerateText}>Clear & Regenerate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hint */}
      <Text style={styles.hint}>
        The center+radius generates a regular polygon approximation.
        You can edit vertices after creation for irregular shapes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 10, fontWeight: '600', color: '#888', marginBottom: 3 },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  vertexRow: { flexDirection: 'row', gap: 4 },
  vertexBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vertexBtnActive: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },
  vertexText: { fontSize: 10, color: '#666' },
  vertexTextActive: { color: '#1565C0', fontWeight: '600' },
  generateBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  generateText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  error: { fontSize: 11, color: '#E53935', marginTop: 4 },
  previewBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  previewTitle: { fontSize: 12, fontWeight: '700', color: '#2E7D32', marginBottom: 6 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  previewLabel: { fontSize: 11, color: '#555' },
  previewValue: { fontSize: 11, fontWeight: '600', color: '#333' },
  previewValueMono: { fontSize: 10, color: '#333', fontFamily: 'monospace' },
  regenerateBtn: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  regenerateText: { fontSize: 11, color: '#2E7D32', fontWeight: '500' },
  hint: { fontSize: 10, color: '#999', marginTop: 8, fontStyle: 'italic', lineHeight: 14 },
});