/**
 * TopHeader — SoilzePro Top Navigation Bar
 *
 * 64px height with:
 * - Page title on left
 * - Global search bar (center)
 * - Notifications bell + User profile dropdown (right)
 *
 * Source of truth: soilzepro-research/markdown-wireframes.md
 */

import { useState } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { SHADOWS } from '../../@core/constants/theme';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Farm overview & key metrics' },
  fields: { title: 'Field Management', subtitle: 'Interactive map & zone management' },
  sensors: { title: 'IoT Sensors', subtitle: 'Real-time environmental monitoring' },
  microbiome: { title: 'Microbiome Analytics', subtitle: 'Soil health & biological diversity' },
  recommendations: { title: 'Recommendations', subtitle: 'AI-powered farming insights' },
  interventions: { title: 'Interventions', subtitle: 'Action log & task tracking' },
  reports: { title: 'Reports', subtitle: 'Data export & analysis reports' },
  settings: { title: 'Settings', subtitle: 'Account & application preferences' },
};

export function TopHeader({ activeRoute }) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const pageInfo = PAGE_TITLES[activeRoute] || PAGE_TITLES.dashboard;

  const headerStyle = {
    height: 64,
    minHeight: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    backgroundColor: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
    zIndex: 20,
    gap: 24,
  };

  const leftSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 200,
    flexShrink: 0,
  };

  const titleStyle = {
    fontSize: 18,
    fontWeight: 800,
    color: colors.textPrimary,
    margin: 0,
    padding: 0,
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
    lineHeight: 1.2,
  };

  const subtitleStyle = {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 500,
    margin: 0,
    padding: 0,
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
  };

  const searchContainerStyle = {
    flex: 1,
    maxWidth: 480,
    position: 'relative',
  };

  const searchInputStyle = {
    width: '100%',
    height: 38,
    padding: '0 16px 0 40px',
    borderRadius: 10,
    border: `1px solid ${searchFocused ? colors.primary : colors.border}`,
    backgroundColor: searchFocused ? `${colors.primary}08` : colors.surfaceHover,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
    boxSizing: 'border-box',
  };

  const searchIconStyle = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
    color: colors.textMuted,
    pointerEvents: 'none',
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  };

  const iconButtonStyle = {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
    position: 'relative',
    transition: 'all 0.15s ease',
  };

  const notificationBadgeStyle = {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.surface}`,
  };

  const profileButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const avatarSmallStyle = {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: colors.primaryGlow,
  };

  const profileNameStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textPrimary,
    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  // Notification dropdown
  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 320,
    maxHeight: 400,
    overflowY: 'auto',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    boxShadow: SHADOWS.cardHover,
    zIndex: 100,
    padding: 8,
  };

  const notifItemStyle = {
    display: 'flex',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  };

  return (
    <header style={headerStyle} data-testid="soilzepro-header">
      {/* Page Title */}
      <div style={leftSectionStyle}>
        <h1 style={titleStyle}>{pageInfo.title}</h1>
        <p style={subtitleStyle}>{pageInfo.subtitle}</p>
      </div>

      {/* Global Search */}
      <div style={searchContainerStyle}>
        <span style={searchIconStyle}>🔍</span>
        <input
          type="text"
          placeholder="Search fields, sensors, alerts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={searchInputStyle}
          data-testid="global-search"
        />
      </div>

      {/* Right Section */}
      <div style={rightSectionStyle}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            style={iconButtonStyle}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            data-testid="btn-notifications"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            🔔
            <span style={notificationBadgeStyle}>3</span>
          </button>

          {showNotifications && (
            <div style={dropdownStyle} data-testid="notifications-dropdown">
              <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: colors.textPrimary, borderBottom: `1px solid ${colors.border}`, marginBottom: 4 }}>
                Notifications
              </div>
              {[
                { icon: '🚨', title: 'Disease outbreak detected', time: '5 min ago', color: colors.danger },
                { icon: '🌡️', title: 'High temperature alert - Zone A', time: '1 hour ago', color: colors.warning },
                { icon: '💧', title: 'Irrigation completed - Field B', time: '3 hours ago', color: colors.success },
              ].map((notif, i) => (
                <div
                  key={i}
                  style={notifItemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span style={{ fontSize: 16 }}>{notif.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>{notif.title}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            style={profileButtonStyle}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            data-testid="btn-profile"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div style={avatarSmallStyle}>
              {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <span style={profileNameStyle}>{user?.fullName || user?.email || 'Admin'}</span>
            <span style={{ fontSize: 10, color: colors.textMuted }}>▼</span>
          </button>

          {showProfile && (
            <div style={{ ...dropdownStyle, width: 200 }}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: colors.textMuted }}>
                Signed in as <strong style={{ color: colors.textPrimary }}>{user?.email}</strong>
              </div>
              <div style={{ height: 1, backgroundColor: colors.border, margin: '4px 0' }} />
              {[
                { icon: '👤', label: 'My Profile' },
                { icon: '⚙️', label: 'Settings' },
              ].map((item, i) => (
                <button
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', borderRadius: 8, border: 'none',
                    backgroundColor: 'transparent', cursor: 'pointer', fontSize: 12,
                    color: colors.textSecondary, fontWeight: 500,
                    fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHover; e.currentTarget.style.color = colors.textPrimary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.textSecondary; }}
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