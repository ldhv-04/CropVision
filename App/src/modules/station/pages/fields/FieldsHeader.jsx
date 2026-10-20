/**
 * FieldsHeader — Tactical Header Bar for Cadastral Grid.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';

export function FieldsHeader({ onNewField, onExport }) {
  return (
    <View style={styles.headerBar}>
      <Text style={styles.headerTitle}>TACTICAL CADASTRAL GRID // GIS MISSION CONTROL</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerBtn} onPress={onNewField}>
          <Text style={styles.headerBtnText}>+ REGISTER FIELD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
