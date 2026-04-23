/**
 * InferenceLayout — Inference Module Component
 *
 * Orchestrator component. Connects the UI pieces together using the Zustand store.
 * Replaces the 700-line monolith component.
 */

import { View, StyleSheet, Text } from 'react-native';
import { useMemo } from 'react';
import { useInferenceStore } from '../store/useInferenceStore';
import { useLayoutMode } from '../../platform/hooks/useLayoutMode';
import { useDiseaseStats } from '../hooks/useDiseaseStats';

import { InferencePreview } from './InferencePreview';
import { InferenceActionPanel } from './InferenceActionPanel';
import { DiseaseFilter } from './DiseaseFilter';
import { DetectionList } from './DetectionList';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

export function InferenceLayout() {
  const { isCompact } = useLayoutMode();
  const {
    detections,
    hoveredDetectionIndex,
    selectedDetectionIndex,
    activeDiseaseFilter,
    setHovered,
    toggleSelected,
    setDiseaseFilter,
    clearSelection,
    error,
  } = useInferenceStore();

  const { diseaseColorMap, diseaseSummary } = useDiseaseStats(detections);

  // Compute visible boxes based on filter + focus mode
  const visibleIndexes = useMemo(() => {
    if (!detections) return [];

    let indexes = detections.map((_, i) => i);

    // Apply class filter
    if (activeDiseaseFilter !== 'all') {
      indexes = indexes.filter((i) => detections[i]?.class_name === activeDiseaseFilter);
    }

    return indexes;
  }, [detections, activeDiseaseFilter]);

  const focusedIndex = hoveredDetectionIndex ?? selectedDetectionIndex;

  return (
    <View style={[styles.root, isCompact && styles.rootCompact]}>
      {/* LEFT / TOP: Preview + Actions */}
      <View style={styles.mainPane}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <InferencePreview
          visibleIndexes={visibleIndexes}
          diseaseColorMap={diseaseColorMap}
          focusedIndex={focusedIndex}
          onHover={setHovered}
          onPressBox={toggleSelected}
        />
        <InferenceActionPanel />
      </View>

      {/* RIGHT / BOTTOM: Filters + List */}
      <View style={[styles.sidePane, isCompact && styles.sidePaneCompact]}>
        <View style={styles.sideHeader}>
          <Text style={styles.sideTitle}>Kết quả phân tích</Text>
          {selectedDetectionIndex !== null && (
            <Text style={styles.clearBtn} onPress={clearSelection}>Bỏ chọn</Text>
          )}
        </View>

        <DiseaseFilter
          summary={diseaseSummary}
          activeFilter={activeDiseaseFilter}
          onFilterChange={setDiseaseFilter}
        />

        <View style={styles.listContainer}>
          <DetectionList
            detections={detections}
            visibleIndexes={visibleIndexes}
            focusedIndex={focusedIndex}
            selectedIndex={selectedDetectionIndex}
            diseaseColorMap={diseaseColorMap}
            onPress={toggleSelected}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  rootCompact: {
    flexDirection: 'column',
  },
  mainPane: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
  },
  sidePane: {
    flex: 1,
    minWidth: 300,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    display: 'flex',
    flexDirection: 'column',
  },
  sidePaneCompact: {
    height: 400, // Fixed height on mobile to prevent squishing the image
  },
  sideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sideTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  clearBtn: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    marginTop: SPACING.sm,
  },
  errorBanner: {
    backgroundColor: `${COLORS.danger}20`,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.sm, textAlign: 'center' },
});
