/**
 * ControlWidget — Upload + Analyze action panel
 *
 * Hiển thị 2 nút: "Chọn ảnh" và "Phân tích ngay" từ InferenceActionPanel.
 * Được căn giữa trong vùng Control của inference layout.
 */

import { InferenceActionPanel } from '../../../../inference/components/InferenceActionPanel';
import { ws } from '../styles';

export function ControlWidget() {
  return (
    <div style={{
      ...ws.fill,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      backgroundColor: '#111',
      borderRadius: 8,
      borderTop: '1px solid #222',
    }}>
      <InferenceActionPanel />
    </div>
  );
}
