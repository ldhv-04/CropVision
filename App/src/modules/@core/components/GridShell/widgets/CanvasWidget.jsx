/**
 * CanvasWidget — Image preview + YOLO detection overlay
 *
 * Hiển thị ảnh được chọn cùng với các bounding box từ YOLO.
 * Có placeholder khi chưa chọn ảnh.
 * Hiển thị tên file ở góc dưới với ellipsis nếu tên quá dài.
 */

import { useInferenceStore } from '../../../../inference/store/useInferenceStore';
import { useDiseaseStats } from '../../../../inference/hooks/useDiseaseStats';
import { useVisibleIndexes } from '../../../../inference/hooks/useVisibleIndexes';
import { InferencePreview } from '../../../../inference/components/InferencePreview';
import { ws } from '../styles';
import { useTheme } from '../../../context/ThemeContext';

export function CanvasWidget() {
  const {
    detections, hoveredDetectionIndex, selectedDetectionIndex,
    activeDiseaseFilter, setHovered, toggleSelected, imageUri, imageName,
  } = useInferenceStore();
  const { diseaseColorMap } = useDiseaseStats(detections);
  const visibleIndexes = useVisibleIndexes(detections, activeDiseaseFilter);
  const { colors } = useTheme();

  return (
    <div style={{ ...ws.fill, backgroundColor: colors.surfaceAlt, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      {imageUri ? (
        <>
          <InferencePreview
            visibleIndexes={visibleIndexes}
            diseaseColorMap={diseaseColorMap}
            focusedIndex={hoveredDetectionIndex ?? selectedDetectionIndex}
            onHover={setHovered}
            onPressBox={toggleSelected}
          />
          {/* Hiển thị tên file ảnh ở góc dưới bên trái, có ellipsis nếu quá dài */}
          {imageName && (
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#aaa',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}>
              {imageName}
            </div>
          )}
        </>
      ) : (
        <div style={{
          ...ws.fill,
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textSecondary,
          fontSize: 14,
          gap: 8,
        }}>
          <div style={{ fontSize: 48, opacity: 0.3 }}>🖼️</div>
          <div>Tải ảnh lên để bắt đầu phân tích</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Hỗ trợ JPG, PNG, WEBP</div>
        </div>
      )}
    </div>
  );
}
