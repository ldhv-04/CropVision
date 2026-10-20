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
import { SIDEBAR_STYLES, getItemStyles } from './SidebarStyles';

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

  const renderItem = (item) => {
    const isActive = activeItem.key === item.key;
    const s = getItemStyles(isActive);

    return (
      <button
        key={item.key}
        onClick={() => router.push(item.href)}
        aria-current={isActive ? 'page' : undefined}
        style={s.item}
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
        <span style={s.icon}>{item.icon}</span>
        <div style={s.label}>
          <div>{item.label}</div>
          {item.subtitle && !isActive && <div style={s.desc}>{item.subtitle}</div>}
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

  return (
    <aside style={SIDEBAR_STYLES.sidebar} data-testid="soilzepro-sidebar">
      {/* Tactical Brand Header */}
      <div style={SIDEBAR_STYLES.brandArea}>
        <div style={SIDEBAR_STYLES.brandLogo}>📡</div>
        <div>
          <div style={SIDEBAR_STYLES.brandName}>CROPVISION</div>
          <div style={SIDEBAR_STYLES.brandSub}>
            <span style={SIDEBAR_STYLES.pulseDot} />
            {isAdmin ? 'COMMAND // ADMIN' : 'STATION // SCOUT'}
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={SIDEBAR_STYLES.scrollArea}>
        <div style={SIDEBAR_STYLES.sectionLabel}>
          <span>TACTICAL OPERATIONS</span>
          <span style={{ fontSize: 7, color: TACTICAL_THEME.radar }}>● READY</span>
        </div>
        {primaryItems.map(renderItem)}

        <div style={SIDEBAR_STYLES.sectionLabel}>
          <span>TELEMETRY & INTEL</span>
          <span style={{ fontSize: 7, color: TACTICAL_THEME.satellite }}>● SYNC</span>
        </div>
        {intelligenceItems.map(renderItem)}
      </div>

      {/* Bottom Console Section */}
      <div style={SIDEBAR_STYLES.bottomSection}>
        {/* Settings / Controls */}
        {bottomItems.map(renderItem)}

        {/* Commander Info */}
        <div style={SIDEBAR_STYLES.userInfo}>
          <div style={SIDEBAR_STYLES.avatar}>
            {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={SIDEBAR_STYLES.userName}>{user?.fullName || user?.email || 'Field Commander'}</div>
            <div style={SIDEBAR_STYLES.userRole}>{isAdmin ? 'SYS_ADMIN // LEVEL 4' : 'FIELD_OPERATOR'}</div>
          </div>
        </div>

        {/* Terminate Session */}
        <button
          onClick={async () => {
            await logout();
            window.location.href = '/welcome';
          }}
          style={SIDEBAR_STYLES.logoutBtn}
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
