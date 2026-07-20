/**
 * Sidebar — SoilzePro Left Navigation
 *
 * 260px fixed sidebar with:
 * - Logo/brand header
 * - Main navigation (5 sections per SoilzePro)
 * - Sub-navigation for analytics pages
 * - User profile section at bottom
 *
 * Source of truth: soilzepro-research/navigation-architecture.md
 */

import { router, usePathname } from 'expo-router';
import { useTheme } from '../../@core/context/ThemeContext';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { SHADOWS } from '../../@core/constants/theme';
import { STATION_NAV_ITEMS, getStationRouteMeta } from '../navigation';

export function Sidebar() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();
  const activeItem = getStationRouteMeta(pathname);
  const isAdmin = user?.role === 'admin';
  const primaryItems = STATION_NAV_ITEMS.filter(
    (item) => item.section === 'primary' && item.visibility !== 'hidden',
  );
  const intelligenceItems = STATION_NAV_ITEMS.filter(
    (item) => item.section === 'intelligence' && item.visibility !== 'hidden',
  );
  const bottomItems = STATION_NAV_ITEMS.filter(
    (item) => item.section === 'bottom' && item.visibility !== 'hidden',
  );

  const sidebarStyle = {
    width: 260,
    minWidth: 260,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.surface,
    borderRight: `1px solid ${colors.border}`,
    boxShadow: SHADOWS.card,
    overflow: 'hidden',
    zIndex: 30,
  };

  const brandAreaStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 20px 16px',
    borderBottom: `1px solid ${colors.border}`,
    background: colors.gradientPrimary,
  };

  const brandIconStyle = {
    fontSize: 28,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
  };

  const brandNameStyle = {
    fontSize: 17,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.5px',
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
  };

  const brandSubStyle = {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 500,
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
  };

  const scrollAreaStyle = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 12px 0',
    gap: 2,
  };

  const sectionLabelStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    padding: '16px 12px 6px',
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
  };

  const renderItem = (item) => {
    const isActive = activeItem.key === item.key;
    const itemStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 10,
      border: 'none',
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: isActive ? 700 : 500,
      color: isActive ? colors.primaryGlow : colors.textSecondary,
      backgroundColor: isActive ? `${colors.primary}20` : 'transparent',
      transition: 'all 0.15s ease',
      fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
    };

    const iconStyle = {
      fontSize: 16,
      width: 22,
      textAlign: 'center',
      flexShrink: 0,
    };

    const labelStyle = {
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    const descStyle = {
      fontSize: 9,
      color: colors.textMuted,
      fontWeight: 400,
      display: isActive ? 'none' : 'block',
    };

    const activeIndicatorStyle = {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primaryGlow,
      flexShrink: 0,
    };

    return (
      <button
        key={item.key}
        onClick={() => router.push(item.href)}
        aria-current={isActive ? 'page' : undefined}
        style={itemStyle}
        data-testid={`nav-${item.key}`}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = `${colors.surfaceHover}`;
            e.currentTarget.style.color = colors.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.textSecondary;
          }
        }}
      >
        <span style={iconStyle}>{item.icon}</span>
        <div style={labelStyle}>
          <div>{item.label}</div>
          {item.subtitle && !isActive && (
            <div style={descStyle}>{item.subtitle}</div>
          )}
        </div>
        {isActive && <span style={activeIndicatorStyle} />}
      </button>
    );
  };

  const bottomSectionStyle = {
    padding: '12px',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    marginBottom: 4,
  };

  const avatarStyle = {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${colors.primary}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: colors.primaryGlow,
    flexShrink: 0,
  };

  const userNameStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textPrimary,
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
  };

  const userRoleStyle = {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: 500,
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
  };

  const logoutBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px',
    borderRadius: 10,
    border: `1px solid ${colors.danger}30`,
    backgroundColor: `${colors.danger}10`,
    color: colors.danger,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
    transition: 'all 0.15s ease',
  };

  return (
    <aside style={sidebarStyle} data-testid="soilzepro-sidebar">
      {/* Brand */}
      <div style={brandAreaStyle}>
        <span style={brandIconStyle}>🌿</span>
        <div>
          <div style={brandNameStyle}>CropVision</div>
          <div style={brandSubStyle}>{isAdmin ? 'Admin Console' : 'Smart Farming'} · AI</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={scrollAreaStyle}>
        <div style={sectionLabelStyle}>Main</div>
        {primaryItems.map(renderItem)}

        <div style={sectionLabelStyle}>Intelligence</div>
        {intelligenceItems.map(renderItem)}
      </div>

      {/* Bottom Section */}
      <div style={bottomSectionStyle}>
        {/* Settings */}
        {bottomItems.map(renderItem)}

        {/* User Info */}
        <div style={userInfoStyle}>
          <div style={avatarStyle}>
            {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={userNameStyle}>{user?.fullName || user?.email || 'Admin'}</div>
            <div style={userRoleStyle}>{isAdmin ? 'Administrator' : 'User'}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            await logout();
            window.location.href = '/welcome';
          }}
          style={logoutBtnStyle}
          data-testid="btn-logout"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${colors.danger}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${colors.danger}10`;
          }}
        >
          <span>🚪</span> Đăng xuất
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
