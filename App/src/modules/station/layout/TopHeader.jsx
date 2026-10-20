/**
 * TopHeader — Tactical Agronomy Telemetry HUD Header
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * 60px fixed height telemetry header with live system clock and status indicators.
 */

import React, { useState, useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { getStationRouteMeta } from '../navigation';
import { TACTICAL_THEME } from '../constants/tacticalTheme';
import { getHeaderStyles } from './TopHeaderStyles';

export function TopHeader() {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const pageInfo = getStationRouteMeta(pathname);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const styles = getHeaderStyles(searchFocused);

  return (
    <header style={styles.header} data-testid="soilzepro-header">
      {/* Page Title & Breadcrumb */}
      <div style={styles.leftSection}>
        <div style={styles.breadcrumb}>
          <span>STATION //</span>
          <span>{pageInfo.title}</span>
        </div>
        <h1 style={styles.title}>{pageInfo.subtitle || pageInfo.title}</h1>
      </div>

      {/* Global Tactical Search & Telemetry Clock */}
      <div style={styles.centerSection}>
        <div style={styles.searchContainer}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder="Search fields, sensors, threats, zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={styles.searchInput}
            data-testid="global-search"
          />
          <span style={styles.kbd}>⌘K</span>
        </div>

        {/* Live Clock & Link State */}
        <div style={styles.telemetryTicker}>
          <span style={{ color: TACTICAL_THEME.radar, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: TACTICAL_THEME.radar, boxShadow: '0 0 6px #00F5A0' }} />
            ONLINE
          </span>
          <span style={{ color: TACTICAL_THEME.border }}>|</span>
          <span style={{ color: TACTICAL_THEME.textPrimary }}>{currentTime}</span>
        </div>
      </div>

      {/* Right Telemetry Controls */}
      <div style={styles.rightSection}>
        {/* Notifications HUD */}
        <div style={{ position: 'relative' }}>
          <button
            style={styles.iconButton}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            data-testid="btn-notifications"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.radar; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.border; }}
          >
            ⚡
            <span style={styles.notificationBadge}>3</span>
          </button>

          {showNotifications && (
            <div style={styles.dropdown} data-testid="notifications-dropdown">
              <div style={{
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 800,
                color: TACTICAL_THEME.radar,
                fontFamily: TACTICAL_THEME.fontMono,
                borderBottom: `1px solid ${TACTICAL_THEME.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>ACTIVE THREAT ALERTS</span>
                <span style={{ fontSize: 9, color: TACTICAL_THEME.textMuted }}>REAL-TIME</span>
              </div>
              {[
                { icon: '🚨', title: 'Disease outbreak detected - Zone A4', time: '5 min ago', level: 'CRITICAL', color: TACTICAL_THEME.alert },
                { icon: '🌡️', title: 'High canopy heat stress - Field B', time: '1 hour ago', level: 'WARNING', color: TACTICAL_THEME.telemetry },
                { icon: '💧', title: 'Precision irrigation completed - Sector 2', time: '3 hours ago', level: 'NOMINAL', color: TACTICAL_THEME.radar },
              ].map((notif, i) => (
                <div
                  key={i}
                  style={styles.notifItem}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span style={{ fontSize: 16 }}>{notif.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: TACTICAL_THEME.textPrimary }}>{notif.title}</span>
                      <span style={{
                        fontSize: 8,
                        fontWeight: 800,
                        color: notif.color,
                        fontFamily: TACTICAL_THEME.fontMono,
                        backgroundColor: `${notif.color}15`,
                        padding: '1px 4px',
                        borderRadius: 3,
                      }}>{notif.level}</span>
                    </div>
                    <div style={{ fontSize: 10, color: TACTICAL_THEME.textMuted, marginTop: 3, fontFamily: TACTICAL_THEME.fontMono }}>{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commander Profile Console */}
        <div style={{ position: 'relative' }}>
          <button
            style={styles.profileButton}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            data-testid="btn-profile"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.satellite; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.border; }}
          >
            <div style={styles.avatarSmall}>
              {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <span style={styles.profileName}>{user?.fullName || user?.email || 'Commander'}</span>
            <span style={{ fontSize: 8, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>▼</span>
          </button>

          {showProfile && (
            <div style={{ ...styles.dropdown, width: 220 }}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>
                OPERATOR ID: <br />
                <strong style={{ color: TACTICAL_THEME.textPrimary, fontSize: 12 }}>{user?.email || 'admin@cropvision.ai'}</strong>
              </div>
              <div style={{ height: 1, backgroundColor: TACTICAL_THEME.border, margin: '4px 0' }} />
              {[
                { icon: '👤', label: 'Operator Credentials' },
                { icon: '⚙️', label: 'Telemetry Settings' },
              ].map((item, i) => (
                <button
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', borderRadius: 6, border: 'none',
                    backgroundColor: 'transparent', cursor: 'pointer', fontSize: 12,
                    color: TACTICAL_THEME.textSecondary, fontWeight: 500,
                    fontFamily: TACTICAL_THEME.fontFamily,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = TACTICAL_THEME.textPrimary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = TACTICAL_THEME.textSecondary; }}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
