/**
 * ResultsWidget — Detection list with hover/select interactions
 */

import { useInferenceStore } from '../../../inference/store/useInferenceStore';
import { useDiseaseStats } from '../../../inference/hooks/useDiseaseStats';
import { useVisibleIndexes } from '../../../inference/hooks/useVisibleIndexes';
import { DetectionList } from '../../../inference/components/DetectionList';
import { ws } from '../../../@core/components/GridShell/styles';

export function ResultsWidget() {
  const {
    detections, hoveredDetectionIndex, selectedDetectionIndex,
    activeDiseaseFilter, toggleSelected,
  } = useInferenceStore();
  const { diseaseColorMap } = useDiseaseStats(detections);
  const visibleIndexes = useVisibleIndexes(detections, activeDiseaseFilter);

  return (
    <div style={ws.fill}>
      <DetectionList
        detections={detections}
        visibleIndexes={visibleIndexes}
        focusedIndex={hoveredDetectionIndex ?? selectedDetectionIndex}
        selectedIndex={selectedDetectionIndex}
        diseaseColorMap={diseaseColorMap}
        onPress={toggleSelected}
      />
    </div>
  );
}

export default ResultsWidget;
