/**
 * UserWidget — Current user info + role badge + Dark/Light mode toggle.
 *
 * The theme toggle button switches between Dark and Light mode globally
 * via ThemeContext. The preference is persisted to localStorage.
 */

import { useAuthStore } from '../../../auth/useAuthStore';
import { useTheme } from '../../../context/ThemeContext';

export function UserWidget() {
  const user               = useAuthStore((s) => s.user);
  const isAdmin            = user?.role === 'admin';
  const { colors, isDark, toggleTheme } = useTheme();

  const containerStyle = {
    padding: '10px 14px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
  };

  const avatarStyle = {
    width: 34, height: 34, borderRadius: 17,
    background: colors.gradientPrimary,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 700, color: '#fff',
    flexShrink: 0,
  };

  const badgeStyle = {
    display: 'inline-block',
    backgroundColor: isAdmin ? `${colors.primary}28` : colors.successBg,
    color: isAdmin ? colors.primaryGlow : colors.success,
    fontSize: 10, fontWeight: 700, padding: '2px 7px',
    borderRadius: 999, border: `1px solid ${isAdmin ? colors.primary : colors.successBorder}`,
  };

  const toggleStyle = {
    marginLeft: 'auto',
    padding: '5px 10px',
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surfaceAlt,
    color: colors.textSecondary,
    fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 5,
    transition: 'background-color 0.2s, border-color 0.2s',
    flexShrink: 0,
  };

  const initials = (user?.fullName || user?.email || '?')
    .charAt(0).toUpperCase();

  return (
    <div style={containerStyle}>
      {/* Avatar */}
      <div style={avatarStyle}>{initials}</div>

      {/* User info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ color: colors.textPrimary, fontSize: 13, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.fullName || user?.email}
        </span>
        <span style={badgeStyle}>{isAdmin ? '⭐ Admin' : '👤 User'}</span>
      </div>

      {/* Dark / Light toggle */}
      <button
        id="theme-toggle-btn"
        onClick={toggleTheme}
        style={toggleStyle}
        title={isDark ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
