/**
 * useOverlayBoxes — Inference Module Hook
 *
 * Computes pixel-level bounding box coordinates from the raw YOLO
 * detection data relative to the rendered preview container.
 *
 * Extracted from the 700-line MainDashBoard useMemo block.
 * Pure computation — no platform imports, no side effects.
 */

import { useMemo } from 'react';

/**
 * @param {Array}  detections    - Raw YOLO boxes e.g. [{x1,y1,x2,y2,class_name,confidence}]
 * @param {Object} previewFrame  - Measured container {width, height}
 * @param {Object} imageMetadata - Original image {width, height}
 * @returns {Array} Computed overlay boxes with pixel coordinates
 */
export function useOverlayBoxes({ detections, previewFrame, imageMetadata }) {
  return useMemo(() => {
    if (
      !detections?.length ||
      !previewFrame.width  || !previewFrame.height ||
      !imageMetadata.width || !imageMetadata.height
    ) {
      return [];
    }

    const scale        = Math.min(previewFrame.width / imageMetadata.width, previewFrame.height / imageMetadata.height);
    const renderedW    = imageMetadata.width  * scale;
    const renderedH    = imageMetadata.height * scale;
    const offsetX      = (previewFrame.width  - renderedW) / 2;
    const offsetY      = (previewFrame.height - renderedH) / 2;

    return detections.map((box, index) => ({
      index,
      left:   offsetX + box.x1 * scale,
      top:    offsetY + box.y1 * scale,
      width:  Math.max((box.x2 - box.x1) * scale, 18),
      height: Math.max((box.y2 - box.y1) * scale, 18),
    }));
  }, [detections, previewFrame, imageMetadata]);
}
