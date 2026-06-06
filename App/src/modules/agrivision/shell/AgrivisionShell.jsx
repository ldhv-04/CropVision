/**
 * AgrivisionShell — Agrivision-owned shell entry point.
 *
 * Boundary adapter only. It delegates to the existing compatibility GridShell
 * until Agrivision inference widgets move out of @core.
 */

import { GridShell } from '../../@core/components/GridShell';

export function AgrivisionShell() {
  return <GridShell />;
}

export default AgrivisionShell;
