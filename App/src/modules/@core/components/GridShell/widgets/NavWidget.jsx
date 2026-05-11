/**
 * NavWidget — Brand / logo area
 * Displays CropVision branding + current user role.
 */

import { useAuthStore } from '../../../auth/useAuthStore';
import { ws } from '../styles';

export function NavWidget() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  return (
    <div style={ws.navWidget}>
      <div style={ws.brand}>
        <span style={ws.brandName}>CropVision</span>
        <span style={ws.brandRole}>
          {isAdmin ? 'Admin' : 'Người dùng'} · {user?.email || ''}
        </span>
      </div>
    </div>
  );
}
