/**
 * MapToolbar — Floating toolbar for map tools (left edge).
 *
 * Tools: Pan/Select, Draw Polygon, Edit Boundary, Measure, Current Location
 */

import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

const TOOLS = [
  { id: 'pan', icon: '🖐️', label: 'Pan', shortcut: 'V' },
  { id: 'draw', icon: '✏️', label: 'Draw', shortcut: 'D' },
  { id: 'edit', icon: '🔧', label: 'Edit', shortcut: 'E' },
  { id: 'measure', icon: '📏', label: 'Measure', shortcut: 'M' },
  { id: 'locate', icon: '📍', label: 'My Location', shortcut: 'L' },
];

export default function MapToolbar({ activeTool, onToolChange }) {
  const handlePress = useCallback(
    (toolId) => {
      if (toolId === 'locate') {
        // TODO: Geolocation integration
        return;
      }
      onToolChange(toolId === activeTool ? 'pan' : toolId);
    },
    [activeTool, onToolChange]
  );

  return (
    <View style={styles.container}>
      {TOOLS.map((tool) => {
        const isActive = tool.id === activeTool;
        return (
          <TouchableOpacity
            key={tool.id}
            style={[styles.button, isActive && styles.buttonActive]}
            onPress={() => handlePress(tool.id)}
            accessibilityLabel={tool.label}
            accessibilityRole="button"
          >
            <Text style={styles.icon}>{tool.icon}
              
            </Text>
            {<Text style={styles.label}>{tool.label}</Text>} 
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    top: 60,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1000,
    gap: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 40,
  },
  buttonActive: {
    backgroundColor: '#ffffff',
  },
  icon: {
    fontSize: 18,
    textAlign: 'center',
    width: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
});