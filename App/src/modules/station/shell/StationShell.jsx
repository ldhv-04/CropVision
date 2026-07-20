/**
 * StationShell — Station-owned shell entry point.
 *
 * @deprecated Frozen compatibility adapter. Canonical Station uses
 * SoilzeProShell + <Slot />; do not add new consumers to this chain.
 * Moving or deleting it requires a separately approved plan.
 */

import { MapShell } from '../../@core/components/MapShell';

export function StationShell() {
  return <MapShell />;
}

export default StationShell;
