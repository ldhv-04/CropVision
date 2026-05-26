/**
 * NavWidget — Brand / logo area with Forest Green gradient.
 * Displays CropVision leaf icon + branding on premium gradient background.
 */

import { useAuthStore } from '../../../auth/useAuthStore';
import { ws } from '../styles';

export function NavWidget() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <div style={ws.navWidget}>
      <div style={ws.brand}>
        <span style={ws.brandIcon}>🌿</span>
        <div style={ws.brandText}>
          <span style={ws.brandName}>CropVision</span>
          <span style={ws.brandRole}>
            {isAdmin ? 'Admin' : 'Smart Farming'} · AI
          </span>
        </div>
      </div>
    </div>
  );
}
