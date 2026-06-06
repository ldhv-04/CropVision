/**
 * OverviewStatsWidget — Professional KPI Cards
 *
 * Displays 4 key metrics with real API data:
 * - Scans this week (with WoW change)
 * - Active farmers (with WoW change)
 * - Diseases detected (with WoW change)
 * - Active alerts
 *
 * Design: Grafana/Vercel-inspired dark cards with trend indicators.
 * Theme-aware: uses useTheme() for light/dark mode support.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../@core/auth/useAuthStore';
import { apiRequest } from '../../../@core/api/apiClient';
import { ENDPOINTS } from '../../../@core/api/endpoints';
import { useTheme } from '../../../@core/context/ThemeContext';

function getKpiConfig(c, isDark) {
  const bg = c.surface;
  return [
    { key: 'scans', icon: '🔬', color: c.info, gradient: `linear-gradient(135deg, ${c.infoBg || (isDark ? '#0a1f2e' : '#e0f2fe')} 0%, ${bg} 100%)`, testID: 'kpi-samples' },
    { key: 'farmers', icon: '👨‍🌾', color: c.primaryGlow, gradient: `linear-gradient(135deg, ${c.successBg || (isDark ? '#0d2a1a' : '#dcfce7')} 0%, ${bg} 100%)`, testID: 'kpi-users' },
    { key: 'diseases', icon: '🦠', color: c.warning, gradient: `linear-gradient(135deg, ${c.warningBg || (isDark ? '#261a00' : '#fef9c3')} 0%, ${bg} 100%)`, testID: 'kpi-today' },
    { key: 'alerts', icon: '🚨', color: c.danger, gradient: `linear-gradient(135deg, ${c.dangerBg || (isDark ? '#250e0e' : '#fee2e2')} 0%, ${bg} 100%)`, testID: 'kpi-accuracy' },
  ];
}

function getStyles(c) {
  return {
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      height: '100%',
      padding: 0,
    },
    card: {
      borderRadius: 14,
      padding: '16px 18px',
      border: `1px solid ${c.border}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    icon: {
      fontSize: 22,
    },
    changeBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 20,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    value: {
      fontSize: 28,
      fontWeight: 800,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: 1.1,
      letterSpacing: '-0.5px',
    },
    label: {
      fontSize: 11,
      fontWeight: 600,
      color: c.textMuted,
      marginTop: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    loadingShimmer: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
      background: `linear-gradient(90deg, ${c.surface} 0%, ${c.border} 50%, ${c.surface} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    },
  };
}

export function OverviewStatsWidget() {
  const token = useAuthStore((s) => s.token);
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const styles = getStyles(colors);
  const KPI_CONFIG = getKpiConfig(colors, isDark);

  useEffect(() => {
    apiRequest(ENDPOINTS.admin.statsEnhanced, {}, token)
      .then((data) => { if (data.success) setStats(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        {KPI_CONFIG.map((kpi) => (
          <div key={kpi.key} style={{ ...styles.card, background: kpi.gradient }}>
            <div style={styles.loadingShimmer} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {KPI_CONFIG.map((kpi) => {
        const data = stats?.[kpi.key];
        if (!data) return null;

        const change = data.change;
        const isPositive = change > 0;
        const isNeutral = change === 0;
        const changeColor = kpi.key === 'diseases'
          ? (isPositive ? colors.danger : colors.success) // More diseases = bad
          : (isPositive ? colors.success : isNeutral ? colors.textMuted : colors.danger);

        return (
          <div key={kpi.key} style={{ ...styles.card, background: kpi.gradient }} data-testid={kpi.testID}>
            <div style={styles.cardHeader}>
              <span style={{ ...styles.icon, filter: `drop-shadow(0 0 8px ${kpi.color}40)` }}>{kpi.icon}</span>
              {change !== undefined && (
                <div style={{ ...styles.changeBadge, color: changeColor, backgroundColor: `${changeColor}15` }}>
                  <span>{isPositive ? '↑' : isNeutral ? '→' : '↓'}</span>
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
            </div>
            <div style={{ ...styles.value, color: kpi.color }}>
              {data.value?.toLocaleString() ?? '—'}
            </div>
            <div style={styles.label}>{data.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default OverviewStatsWidget;
