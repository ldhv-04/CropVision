/**
 * ControlWidget — Upload + Analyze action panel
 *
 * Hiển thị 2 nút: "Chọn ảnh" và "Phân tích ngay" từ InferenceActionPanel.
 * Được căn giữa trong vùng Control của inference layout.
 */

import { InferenceActionPanel } from '../../../inference/components/InferenceActionPanel';
import { ws } from '../../../@core/components/GridShell/styles';
import { useTheme } from '../../../@core/context/ThemeContext';

export function ControlWidget() {
  const { colors } = useTheme();
  
  return (
    <div style={{
      ...ws.fill,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 8,
      borderTop: `1px solid ${colors.border}`,
    }}>
      <InferenceActionPanel />
    </div>
  );
}

export default ControlWidget;
