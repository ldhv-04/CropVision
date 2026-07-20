/**
 * StatsWidget — Disease filter chips + summary
 */

import { useInferenceStore } from '../../../inference/store/useInferenceStore';
import { useDiseaseStats } from '../../../inference/hooks/useDiseaseStats';
import { DiseaseFilter } from '../../../inference/components/DiseaseFilter';
import { ws } from '../../../@core/components/GridShell/styles';

export function StatsWidget() {
  const {
    detections, activeDiseaseFilter, setDiseaseFilter,
    selectedDetectionIndex, clearSelection, toggleSelected,
  } = useInferenceStore();
  const { diseaseSummary, diseaseColorMap } = useDiseaseStats(detections);

  if (!detections?.length) {
    return (
      <div style={{ ...ws.pad, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ color: '#666', fontSize: 13 }}>Chưa có kết quả phân tích</span>
      </div>
    );
  }

  return (
    <div style={{ ...ws.pad, overflow: 'auto', height: '100%' }}>
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

      {/* Disease list table */}
      <div style={{ marginTop: 8 }}>
        <div style={tableHeaderStyle}>
          <span style={{ ...colStyle, flex: 2 }}>Bệnh</span>
          <span style={{ ...colStyle, flex: 1, textAlign: 'center' }}>SL</span>
          <span style={{ ...colStyle, flex: 1, textAlign: 'center' }}>Tin cậy</span>
        </div>

        {detections.map((d, index) => {
          const color = diseaseColorMap[d.class_name] || '#888';
          const isActive = activeDiseaseFilter === 'all' || activeDiseaseFilter === d.class_name;
          const isSelected = selectedDetectionIndex === index;
          return (
            <div
              key={index}
              style={{
                ...rowStyle,
                opacity: isActive ? 1 : 0.35,
                backgroundColor: isSelected ? `${color}18` : 'transparent',
                borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                cursor: 'pointer',
              }}
              onClick={() => toggleSelected(index)}
            >
              <span style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.class_name}
                </span>
              </span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#ccc', fontWeight: 600 }}>
                #{index + 1}
              </span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: confidenceColor(d.confidence), fontWeight: 600 }}>
                {(d.confidence * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatsWidget;

function confidenceColor(conf) {
  if (conf >= 0.8) return '#4ade80';
  if (conf >= 0.6) return '#facc15';
  if (conf >= 0.4) return '#fb923c';
  return '#f87171';
}

const tableHeaderStyle = {
  display: 'flex',
  padding: '6px 8px',
  borderBottom: '1px solid #333',
  marginBottom: 2,
};

const colStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '7px 8px',
  borderBottom: '1px solid #1a1a1a',
  transition: 'background-color 0.15s',
};
