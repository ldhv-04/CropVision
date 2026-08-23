/**
 * MapToolbar — Tactical Floating HUD Toolbar
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

const TOOLS = [
  { id: 'pan', icon: '🖐️', label: 'PAN / RETICLE', shortcut: 'V' },
  { id: 'draw', icon: '✏️', label: 'DRAW BOUNDARY', shortcut: 'D' },
  { id: 'edit', icon: '🔧', label: 'EDIT VERTICES', shortcut: 'E' },
  { id: 'measure', icon: '📏', label: 'GEO-MEASURE', shortcut: 'M' },
  { id: 'locate', icon: '📍', label: 'GPS FIX', shortcut: 'L' },
];

export default function MapToolbar({ activeTool, onToolChange }) {
  const handlePress = useCallback(
    (toolId) => {
      if (toolId === 'locate') {
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
            <Text style={styles.icon}>{tool.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tool.label}
            </Text>
            <Text style={[styles.shortcut, isActive && styles.shortcutActive]}>
              [{tool.shortcut}]
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    top: 14,
    backgroundColor: 'rgba(13, 19, 32, 0.92)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: TACTICAL_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1000,
    gap: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    borderColor: TACTICAL_THEME.radar,
  },
  icon: {
    fontSize: 14,
    textAlign: 'center',
    width: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: TACTICAL_THEME.textSecondary,
    fontFamily: TACTICAL_THEME.fontMono,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: TACTICAL_THEME.radar,
    fontWeight: '800',
  },
  shortcut: {
    fontSize: 8,
    color: TACTICAL_THEME.textMuted,
    fontFamily: TACTICAL_THEME.fontMono,
    marginLeft: 8,
  },
  shortcutActive: {
    color: TACTICAL_THEME.radar,
  },
});
