/**
 * CanvasWidget — Image preview + YOLO detection overlay
 */

import { useInferenceStore } from '../../../../inference/store/useInferenceStore';
import { useDiseaseStats } from '../../../../inference/hooks/useDiseaseStats';
import { useVisibleIndexes } from '../../../../inference/hooks/useVisibleIndexes';
import { InferencePreview } from '../../../../inference/components/InferencePreview';
import { ws } from '../styles';

export function CanvasWidget() {
  const {
    detections, hoveredDetectionIndex, selectedDetectionIndex,
    activeDiseaseFilter, setHovered, toggleSelected,
  } = useInferenceStore();
  const { diseaseColorMap } = useDiseaseStats(detections);
  const visibleIndexes = useVisibleIndexes(detections, activeDiseaseFilter);

  return (
    <div style={{ ...ws.fill, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
      <InferencePreview
        visibleIndexes={visibleIndexes}
        diseaseColorMap={diseaseColorMap}
        focusedIndex={hoveredDetectionIndex ?? selectedDetectionIndex}
        onHover={setHovered}
        onPressBox={toggleSelected}
      />
    </div>
  );
}
