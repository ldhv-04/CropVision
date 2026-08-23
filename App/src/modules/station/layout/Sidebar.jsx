/**
 * Sidebar — Tactical Agronomy Command Rail
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * 260px fixed width command sidebar with high-contrast radar styling.
 */

import React from 'react';
import { router, usePathname } from 'expo-router';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { STATION_NAV_ITEMS, getStationRouteMeta } from '../navigation';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

export function Sidebar() {
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
    backgroundColor: TACTICAL_THEME.bgPanelSolid,
    borderRight: `1px solid ${TACTICAL_THEME.border}`,
    boxShadow: TACTICAL_THEME.shadowPanel,
    overflow: 'hidden',
    zIndex: 30,
    userSelect: 'none',
  };

  const brandAreaStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 20px',
    borderBottom: `1px solid ${TACTICAL_THEME.border}`,
    background: 'linear-gradient(180deg, rgba(0, 245, 160, 0.06) 0%, rgba(6, 9, 14, 0.4) 100%)',
  };

  const brandLogoStyle = {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    border: `1px solid ${TACTICAL_THEME.radar}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: TACTICAL_THEME.radar,
    boxShadow: '0 0 10px rgba(0, 245, 160, 0.25)',
  };

  const brandNameStyle = {
    fontSize: 15,
    fontWeight: 800,
    color: TACTICAL_THEME.textPrimary,
    letterSpacing: '0.8px',
    fontFamily: TACTICAL_THEME.fontMono,
    lineHeight: 1.2,
  };

  const brandSubStyle = {
    fontSize: 9,
    color: TACTICAL_THEME.radar,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  };

  const pulseDotStyle = {
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: TACTICAL_THEME.radar,
    boxShadow: '0 0 6px #00F5A0',
    display: 'inline-block',
  };

  const scrollAreaStyle = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 10px',
    gap: 3,
  };

  const sectionLabelStyle = {
    fontSize: 9,
    fontWeight: 800,
    color: TACTICAL_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '1.4px',
    padding: '14px 12px 6px',
    fontFamily: TACTICAL_THEME.fontMono,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const renderItem = (item) => {
    const isActive = activeItem.key === item.key;
    const itemStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '9px 12px',
      borderRadius: 6,
      border: 'none',
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: isActive ? 700 : 500,
      color: isActive ? TACTICAL_THEME.radar : TACTICAL_THEME.textSecondary,
      backgroundColor: isActive ? 'rgba(0, 245, 160, 0.08)' : 'transparent',
      borderLeft: isActive ? `3px solid ${TACTICAL_THEME.radar}` : '3px solid transparent',
      transition: 'all 0.15s ease',
      fontFamily: TACTICAL_THEME.fontFamily,
      position: 'relative',
    };

    const iconStyle = {
      fontSize: 15,
      width: 20,
      textAlign: 'center',
      flexShrink: 0,
      filter: isActive ? 'drop-shadow(0 0 6px rgba(0, 245, 160, 0.6))' : 'none',
    };

    const labelStyle = {
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    const descStyle = {
      fontSize: 9,
      color: TACTICAL_THEME.textMuted,
      fontWeight: 400,
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
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = TACTICAL_THEME.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = TACTICAL_THEME.textSecondary;
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
        {isActive && (
          <span style={{
            fontSize: 8,
            fontWeight: 800,
            color: TACTICAL_THEME.radar,
            backgroundColor: 'rgba(0, 245, 160, 0.15)',
            padding: '2px 5px',
            borderRadius: 3,
            fontFamily: TACTICAL_THEME.fontMono,
          }}>LIVE</span>
        )}
      </button>
    );
  };

  const bottomSectionStyle = {
    padding: '12px',
    borderTop: `1px solid ${TACTICAL_THEME.border}`,
    backgroundColor: 'rgba(6, 9, 14, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    backgroundColor: 'rgba(27, 37, 55, 0.3)',
    border: `1px solid ${TACTICAL_THEME.borderSubtle}`,
  };

  const avatarStyle = {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    border: `1px solid ${TACTICAL_THEME.satellite}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 800,
    color: TACTICAL_THEME.satellite,
    fontFamily: TACTICAL_THEME.fontMono,
    flexShrink: 0,
  };

  const userNameStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: TACTICAL_THEME.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const userRoleStyle = {
    fontSize: 9,
    color: TACTICAL_THEME.textMuted,
    fontWeight: 600,
    fontFamily: TACTICAL_THEME.fontMono,
    letterSpacing: '0.5px',
  };

  const logoutBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 6,
    border: `1px solid rgba(255, 46, 84, 0.3)`,
    backgroundColor: 'rgba(255, 46, 84, 0.08)',
    color: TACTICAL_THEME.alert,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    fontFamily: TACTICAL_THEME.fontFamily,
    transition: 'all 0.15s ease',
  };

  return (
    <aside style={sidebarStyle} data-testid="soilzepro-sidebar">
      {/* Tactical Brand Header */}
      <div style={brandAreaStyle}>
        <div style={brandLogoStyle}>📡</div>
        <div>
          <div style={brandNameStyle}>CROPVISION</div>
          <div style={brandSubStyle}>
            <span style={pulseDotStyle} />
            {isAdmin ? 'COMMAND // ADMIN' : 'STATION // SCOUT'}
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={scrollAreaStyle}>
        <div style={sectionLabelStyle}>
          <span>TACTICAL OPERATIONS</span>
          <span style={{ fontSize: 7, color: TACTICAL_THEME.radar }}>● READY</span>
        </div>
        {primaryItems.map(renderItem)}

        <div style={sectionLabelStyle}>
          <span>TELEMETRY & INTEL</span>
          <span style={{ fontSize: 7, color: TACTICAL_THEME.satellite }}>● SYNC</span>
        </div>
        {intelligenceItems.map(renderItem)}
      </div>

      {/* Bottom Console Section */}
      <div style={bottomSectionStyle}>
        {/* Settings / Controls */}
        {bottomItems.map(renderItem)}

        {/* Commander Info */}
        <div style={userInfoStyle}>
          <div style={avatarStyle}>
            {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={userNameStyle}>{user?.fullName || user?.email || 'Field Commander'}</div>
            <div style={userRoleStyle}>{isAdmin ? 'SYS_ADMIN // LEVEL 4' : 'FIELD_OPERATOR'}</div>
          </div>
        </div>

        {/* Terminate Session */}
        <button
          onClick={async () => {
            await logout();
            window.location.href = '/welcome';
          }}
          style={logoutBtnStyle}
          data-testid="btn-logout"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 46, 84, 0.18)';
            e.currentTarget.style.borderColor = TACTICAL_THEME.alert;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 46, 84, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 46, 84, 0.3)';
          }}
        >
          <span>⏻</span> TERMINATE SESSION
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
