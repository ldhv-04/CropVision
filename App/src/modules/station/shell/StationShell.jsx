/**
 * StationShell — Station-owned shell entry point.
 *
 * Boundary adapter only. It delegates to the existing compatibility MapShell
 * while Station route ownership continues to migrate away from shared shells.
 */

import { MapShell } from '../../@core/components/MapShell';

export function StationShell() {
  return <MapShell />;
}

export default StationShell;
