/**
 * CoordinateEntry — Manual GPS coordinate entry table.
 *
 * Allows users to enter latitude/longitude pairs row by row.
 * Supports: add vertices, remove last, clear all, preview on map.
 */

import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { isValidLatitude, isValidLongitude } from '../../utils/fieldGeometry';

export default function CoordinateEntry({ vertices, onChange }) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState('');

  const addVertex = useCallback(() => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!isValidLatitude(latNum)) {
      setError('Invalid latitude (-90 to 90)');
      return;
    }
    if (!isValidLongitude(lngNum)) {
      setError('Invalid longitude (-180 to 180)');
      return;
    }

    setError('');
    onChange([...vertices, [latNum, lngNum]]);
    setLat('');
    setLng('');
  }, [lat, lng, vertices, onChange]);

  const removeLast = useCallback(() => {
    onChange(vertices.slice(0, -1));
  }, [vertices, onChange]);

  const clearAll = useCallback(() => {
    onChange([]);
    setError('');
  }, [onChange]);

  return (
    <View style={styles.container}>
      {/* Vertex table */}
      {vertices.length > 0 && (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: 30 }]}>#</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Latitude</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Longitude</Text>
          </View>
          {vertices.map(([vLat, vLng], i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, { width: 30, fontWeight: '600' }]}>{i + 1}</Text>
              <Text style={[styles.tableCell, { flex: 1, fontFamily: 'monospace' }]}>
                {vLat.toFixed(6)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, fontFamily: 'monospace' }]}>
                {vLng.toFixed(6)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="10.823100"
            placeholderTextColor="#bbb"
            value={lat}
            onChangeText={setLat}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="106.629700"
            placeholderTextColor="#bbb"
            value={lng}
            onChangeText={setLng}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addVertex}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, vertices.length === 0 && styles.actionBtnDisabled]}
          onPress={removeLast}
          disabled={vertices.length === 0}
        >
          <Text style={styles.actionText}>Remove Last</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, vertices.length === 0 && styles.actionBtnDisabled]}
          onPress={clearAll}
          disabled={vertices.length === 0}
        >
          <Text style={[styles.actionText, { color: '#E53935' }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <Text style={styles.hint}>
        {vertices.length < 3
          ? `Add at least 3 vertices (${vertices.length}/3)`
          : `✓ ${vertices.length} vertices — ready to save`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  table: { marginBottom: 10, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0E0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 6 },
  tableHeaderText: { fontSize: 10, fontWeight: '700', color: '#888', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableCell: { fontSize: 12, color: '#333' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -1 },
  error: { fontSize: 11, color: '#E53935', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#F5F5F5' },
  actionBtnDisabled: { opacity: 0.4 },
  actionText: { fontSize: 11, color: '#666', fontWeight: '500' },
  hint: { fontSize: 11, color: '#888', marginTop: 6, fontStyle: 'italic' },
});