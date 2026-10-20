/**
 * FieldsDrawHud — Floating HUD for polygon drawing and vertex confirmation.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';

export function FieldsDrawHud({ activeTool, onUndo, onFinish, onCancel, vertexCount = 0 }) {
  if (activeTool !== 'draw') return null;

  return (
    <View style={styles.drawActions}>
      <TouchableOpacity style={styles.drawUndoBtn} onPress={onUndo} disabled={vertexCount === 0}>
        <Text style={styles.drawActionText}>UNDO VERTEX ({vertexCount})</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawFinishBtn} onPress={onFinish} disabled={vertexCount < 3}>
        <Text style={styles.drawFinishText}>COMPLETE POLYGON</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawCancelBtn} onPress={onCancel}>
        <Text style={styles.drawCancelText}>ABORT</Text>
      </TouchableOpacity>
    </View>
  );
}
