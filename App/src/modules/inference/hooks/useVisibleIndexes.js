/**
 * useVisibleIndexes — Shared Detection Filtering Hook
 *
 * Computes the list of detection indexes visible after applying the active
 * disease filter.  Used by CanvasWidget, ResultsWidget (GridShell), and
 * InferenceLayout to avoid duplicating the same useMemo logic.
 *
 * @param {Array|null}  detections          — full detection array from store
 * @param {string}      activeDiseaseFilter — 'all' or a specific class_name
 * @returns {number[]}  indexes of detections that pass the filter
 */

import { useMemo } from 'react';

export function useVisibleIndexes(detections, activeDiseaseFilter) {
  return useMemo(() => {
    if (!detections) return [];

    let indexes = detections.map((_, i) => i);

    // Apply class filter — 'all' means no filtering
    if (activeDiseaseFilter !== 'all') {
      indexes = indexes.filter(
        (i) => detections[i]?.class_name === activeDiseaseFilter,
      );
    }

    return indexes;
  }, [detections, activeDiseaseFilter]);
}
