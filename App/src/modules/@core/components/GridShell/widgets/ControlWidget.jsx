/**
 * ControlWidget — Upload + Analyze action panel
 */

import { InferenceActionPanel } from '../../../../inference/components/InferenceActionPanel';
import { ws } from '../styles';

export function ControlWidget() {
  return (
    <div style={{ ...ws.fill, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <InferenceActionPanel />
    </div>
  );
}
