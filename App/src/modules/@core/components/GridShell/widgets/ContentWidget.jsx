/**
 * ContentWidget — legacy compatibility content area for owner-mixed routes
 * Uses useSegments() for exact route matching.
 * Owner-specific content mapping lives in ../compat/contentRegistry.
 */

import { useSegments } from 'expo-router';
import { useAuthStore } from '../../../auth/useAuthStore';
import { getCompatContentBranch } from '../compat/contentRegistry';
import { ws } from '../styles';

export function ContentWidget() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const route = segments[segments.length - 1] ?? '';
  const branch = getCompatContentBranch(route);

  if (!branch) return null;

  const BranchComponent = branch.component;
  const props = branch.getProps({ token, user });
  return <div style={ws.fill}><BranchComponent {...props} /></div>;
}
