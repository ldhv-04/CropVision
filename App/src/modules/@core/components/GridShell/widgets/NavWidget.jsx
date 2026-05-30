/**
 * NavWidget — Brand / logo area with Forest Green gradient.
 * Displays CropVision leaf icon + branding on premium gradient background.
 * Theme-aware: uses useTheme() for light/dark mode support.
 */

import { useAuthStore } from '../../../auth/useAuthStore';
import { useTheme } from '../../../context/ThemeContext';

export function NavWidget() {
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const isAdmin = user?.role === 'admin';

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: colors.gradientPrimary,
    padding: '0 16px',
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const brandIconStyle = {
    fontSize: 26,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
  };

  const brandTextStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const brandNameStyle = {
    fontSize: 15,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.5px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const brandRoleStyle = {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 500,
  };

  return (
    <div style={navStyle}>
      <div style={brandStyle}>
        <span style={brandIconStyle}>🌿</span>
        <div style={brandTextStyle}>
          <span style={brandNameStyle}>CropVision</span>
          <span style={brandRoleStyle}>
            {isAdmin ? 'Admin' : 'Smart Farming'} · AI
          </span>
        </div>
      </div>
    </div>
  );
}