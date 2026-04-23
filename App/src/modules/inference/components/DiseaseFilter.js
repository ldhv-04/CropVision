/**
 * DiseaseFilter — Inference Module Component
 * Filter chip row for selecting which disease class to highlight.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

export function DiseaseFilter({ summary, activeFilter, onFilterChange }) {
  if (!summary?.length) return null;

  return (
    <View style={styles.bar}>
      <Pressable
        style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
        onPress={() => onFilterChange('all')}
      >
        <Text style={styles.chipText}>Tất cả</Text>
      </Pressable>

      {summary.map((item) => (
        <Pressable
          key={item.diseaseName}
          style={[styles.chip, { borderColor: item.color }, activeFilter === item.diseaseName && { backgroundColor: `${item.color}22` }]}
          onPress={() => onFilterChange(item.diseaseName)}
        >
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text style={styles.chipText}>{item.diseaseName}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar:       { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginVertical: SPACING.sm },
  chip:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  chipActive:{ backgroundColor: `${COLORS.primary}22`, borderColor: COLORS.primary },
  chipText:  { color: COLORS.textPrimary, fontSize: FONT_SIZE.xs },
  swatch:    { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.xs },
});
