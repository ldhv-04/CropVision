/**
 * StationShell — Station-owned shell entry point.
 *
 * Boundary adapter only. It delegates to the existing compatibility MapShell
 * until Station dashboard widgets move out of @core.
 */

import { MapShell } from '../../@core/components/MapShell';

export function StationShell() {
  return <MapShell />;
}

export default StationShell;
