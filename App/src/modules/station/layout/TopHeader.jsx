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

  const headerStyle = {
    height: 60,
    minHeight: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    backgroundColor: TACTICAL_THEME.bgPanelSolid,
    borderBottom: `1px solid ${TACTICAL_THEME.border}`,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    zIndex: 20,
    gap: 20,
  };

  const leftSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 220,
    flexShrink: 0,
  };

  const breadcrumbStyle = {
    fontSize: 9,
    fontWeight: 800,
    color: TACTICAL_THEME.radar,
    letterSpacing: '1.2px',
    fontFamily: TACTICAL_THEME.fontMono,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  };

  const titleStyle = {
    fontSize: 16,
    fontWeight: 800,
    color: TACTICAL_THEME.textPrimary,
    margin: 0,
    padding: 0,
    fontFamily: TACTICAL_THEME.fontFamily,
    lineHeight: 1.2,
    letterSpacing: '0.3px',
  };

  const centerSectionStyle = {
    flex: 1,
    maxWidth: 520,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  };

  const searchContainerStyle = {
    flex: 1,
    position: 'relative',
  };

  const searchInputStyle = {
    width: '100%',
    height: 36,
    padding: '0 44px 0 36px',
    borderRadius: 6,
    border: `1px solid ${searchFocused ? TACTICAL_THEME.radar : TACTICAL_THEME.border}`,
    backgroundColor: searchFocused ? 'rgba(0, 245, 160, 0.04)' : TACTICAL_THEME.bgInput,
    color: TACTICAL_THEME.textPrimary,
    fontSize: 12.5,
    fontWeight: 500,
    outline: 'none',
    boxShadow: searchFocused ? '0 0 10px rgba(0, 245, 160, 0.2)' : 'none',
    transition: 'all 0.15s ease',
    fontFamily: TACTICAL_THEME.fontFamily,
    boxSizing: 'border-box',
  };

  const searchIconStyle = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 13,
    color: TACTICAL_THEME.textMuted,
    pointerEvents: 'none',
  };

  const kbdStyle = {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '2px 5px',
    fontSize: 9,
    fontFamily: TACTICAL_THEME.fontMono,
    fontWeight: 700,
    color: TACTICAL_THEME.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${TACTICAL_THEME.border}`,
    borderRadius: 4,
    pointerEvents: 'none',
  };

  const telemetryTickerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 12px',
    borderRadius: 6,
    backgroundColor: 'rgba(6, 9, 14, 0.6)',
    border: `1px solid ${TACTICAL_THEME.borderSubtle}`,
    fontSize: 11,
    fontFamily: TACTICAL_THEME.fontMono,
    color: TACTICAL_THEME.textSecondary,
    flexShrink: 0,
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  };

  const iconButtonStyle = {
    width: 36,
    height: 36,
    borderRadius: 6,
    border: `1px solid ${TACTICAL_THEME.border}`,
    backgroundColor: TACTICAL_THEME.bgInput,
    color: TACTICAL_THEME.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 15,
    position: 'relative',
    transition: 'all 0.15s ease',
  };

  const notificationBadgeStyle = {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: TACTICAL_THEME.alert,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 800,
    fontFamily: TACTICAL_THEME.fontMono,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${TACTICAL_THEME.bgPanelSolid}`,
    boxShadow: '0 0 6px rgba(255, 46, 84, 0.8)',
  };

  const profileButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 6,
    border: `1px solid ${TACTICAL_THEME.border}`,
    backgroundColor: TACTICAL_THEME.bgInput,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const avatarSmallStyle = {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    border: `1px solid ${TACTICAL_THEME.radar}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    color: TACTICAL_THEME.radar,
    fontFamily: TACTICAL_THEME.fontMono,
  };

  const profileNameStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: TACTICAL_THEME.textPrimary,
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: TACTICAL_THEME.fontFamily,
  };

  // Dropdown HUD
  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 320,
    maxHeight: 400,
    overflowY: 'auto',
    backgroundColor: TACTICAL_THEME.bgPanelElevated,
    borderRadius: 8,
    border: `1px solid ${TACTICAL_THEME.border}`,
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0, 245, 160, 0.2)',
    zIndex: 100,
    padding: 8,
  };

  const notifItemStyle = {
    display: 'flex',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    borderBottom: `1px solid ${TACTICAL_THEME.borderSubtle}`,
  };

  return (
    <header style={headerStyle} data-testid="soilzepro-header">
      {/* Page Title & Breadcrumb */}
      <div style={leftSectionStyle}>
        <div style={breadcrumbStyle}>
          <span>STATION //</span>
          <span>{pageInfo.title}</span>
        </div>
        <h1 style={titleStyle}>{pageInfo.subtitle || pageInfo.title}</h1>
      </div>

      {/* Global Tactical Search & Telemetry Clock */}
      <div style={centerSectionStyle}>
        <div style={searchContainerStyle}>
          <span style={searchIconStyle}>⌕</span>
          <input
            type="text"
            placeholder="Search fields, sensors, threats, zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={searchInputStyle}
            data-testid="global-search"
          />
          <span style={kbdStyle}>⌘K</span>
        </div>

        {/* Live Clock & Link State */}
        <div style={telemetryTickerStyle}>
          <span style={{ color: TACTICAL_THEME.radar, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: TACTICAL_THEME.radar, boxShadow: '0 0 6px #00F5A0' }} />
            ONLINE
          </span>
          <span style={{ color: TACTICAL_THEME.border }}>|</span>
          <span style={{ color: TACTICAL_THEME.textPrimary }}>{currentTime}</span>
        </div>
      </div>

      {/* Right Telemetry Controls */}
      <div style={rightSectionStyle}>
        {/* Notifications HUD */}
        <div style={{ position: 'relative' }}>
          <button
            style={iconButtonStyle}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            data-testid="btn-notifications"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.radar; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.border; }}
          >
            ⚡
            <span style={notificationBadgeStyle}>3</span>
          </button>

          {showNotifications && (
            <div style={dropdownStyle} data-testid="notifications-dropdown">
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
                  style={notifItemStyle}
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
            style={profileButtonStyle}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            data-testid="btn-profile"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.satellite; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = TACTICAL_THEME.border; }}
          >
            <div style={avatarSmallStyle}>
              {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <span style={profileNameStyle}>{user?.fullName || user?.email || 'Commander'}</span>
            <span style={{ fontSize: 8, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>▼</span>
          </button>

          {showProfile && (
            <div style={{ ...dropdownStyle, width: 220 }}>
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
