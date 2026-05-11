/**
 * StatsWidget — Disease filter chips + summary
 */

import { useInferenceStore } from '../../../../inference/store/useInferenceStore';
import { useDiseaseStats } from '../../../../inference/hooks/useDiseaseStats';
import { DiseaseFilter } from '../../../../inference/components/DiseaseFilter';
import { ws } from '../styles';

export function StatsWidget() {
  const {
    detections, activeDiseaseFilter, setDiseaseFilter,
    selectedDetectionIndex, clearSelection,
  } = useInferenceStore();
  const { diseaseSummary } = useDiseaseStats(detections);

  return (
    <div style={{ ...ws.pad, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={ws.sectionTitle}>Kết quả phân tích</span>
        {selectedDetectionIndex !== null && (
          <button onClick={clearSelection} style={ws.clearBtn}>Bỏ chọn</button>
        )}
      </div>
      <DiseaseFilter
        summary={diseaseSummary}
        activeFilter={activeDiseaseFilter}
        onFilterChange={setDiseaseFilter}
      />
    </div>
  );
}
