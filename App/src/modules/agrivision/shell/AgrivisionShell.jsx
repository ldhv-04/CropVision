/**
 * AgrivisionShell — Agrivision-owned shell entry point.
 *
 * Boundary adapter only. It delegates to the existing compatibility GridShell
 * while Agrivision route ownership continues to migrate away from shared shells.
 */

import { GridShell } from '../../@core/components/GridShell';

export function AgrivisionShell() {
  return <GridShell />;
}

export default AgrivisionShell;
