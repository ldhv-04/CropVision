/**
 * useDiseaseStats — Inference Module Hook
 *
 * Groups detections by disease class, assigns colors from palette,
 * and returns sorted disease summary. Extracted from MainDashBoard.
 */

import { useMemo } from 'react';

const COLOR_PALETTE = ['#facc15', '#f97316', '#fb7185', '#38bdf8', '#a3e635', '#c084fc'];

/**
 * @param {Array|null} detections - Raw YOLO detection array
 * @returns {{
 *   diseaseColorMap: Record<string, string>,
 *   diseaseSummary: Array<{diseaseName, count, color}>
 * }}
 */
export function useDiseaseStats(detections) {
  const diseaseColorMap = useMemo(() => {
    const names = [...new Set((detections || []).map((d) => d.class_name || 'Không rõ'))];
    return names.reduce((acc, name, i) => {
      acc[name] = COLOR_PALETTE[i % COLOR_PALETTE.length];
      return acc;
    }, {});
  }, [detections]);

  const diseaseSummary = useMemo(() => {
    if (!detections?.length) return [];

    const groups = detections.reduce((acc, d) => {
      const key = d.class_name || 'Không rõ';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([name, count]) => ({ diseaseName: name, count, color: diseaseColorMap[name] || COLOR_PALETTE[0] }))
      .sort((a, b) => b.count - a.count || a.diseaseName.localeCompare(b.diseaseName));
  }, [detections, diseaseColorMap]);

  return { diseaseColorMap, diseaseSummary };
}
