/**
 * ScanTrendWidget — Time-series Scan Trend Chart
 *
 * Displays scan counts per day for the last 30 days.
 * Pure CSS/HTML chart (no external chart library needed).
 * Fetches from /api/admin/stats/timeline
 * Theme-aware: uses useTheme() for light/dark mode support.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../@core/auth/useAuthStore';
import { apiRequest } from '../../../@core/api/apiClient';
import { ENDPOINTS } from '../../../@core/api/endpoints';
import { useTheme } from '../../../@core/context/ThemeContext';

function getStyles(c) {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: c.surface,
      borderRadius: 12,
      border: `1px solid ${c.border}`,
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: `1px solid ${c.border}`,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: 700,
    },
    headerStats: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    headerStat: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: 600,
    },
    headerStatDot: {
      color: c.textMuted,
      fontSize: 11,
    },
    chartArea: {
      flex: 1,
      display: 'flex',
      padding: '12px 8px 4px 4px',
      minHeight: 0,
    },
    yAxis: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingRight: 8,
      minWidth: 28,
    },
    yLabel: {
      color: c.textMuted,
      fontSize: 9,
      textAlign: 'right',
      fontFamily: 'monospace',
    },
    barsContainer: {
      flex: 1,
      display: 'flex',
      alignItems: 'flex-end',
      gap: 2,
      position: 'relative',
    },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: `${c.border}60`,
      pointerEvents: 'none',
    },
    barGroup: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      cursor: 'pointer',
    },
    barWrapper: {
      width: '100%',
      height: 80,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      position: 'relative',
    },
    bar: {
      width: '70%',
      minWidth: 3,
      maxWidth: 12,
      borderRadius: '3px 3px 0 0',
      transition: 'height 0.3s, background-color 0.2s',
    },
    diseaseBar: {
      position: 'absolute',
      bottom: 0,
      width: '70%',
      minWidth: 3,
      maxWidth: 12,
      borderRadius: '3px 3px 0 0',
      transition: 'height 0.3s',
    },
    xLabel: {
      color: c.textMuted,
      fontSize: 8,
      marginTop: 4,
      whiteSpace: 'nowrap',
    },
    tooltip: {
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: c.surfaceAlt || 'rgba(15, 32, 64, 0.97)',
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      padding: '8px 12px',
      marginBottom: 8,
      zIndex: 100,
      minWidth: 140,
      backdropFilter: 'blur(8px)',
    },
    tooltipDate: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 6,
      paddingBottom: 4,
      borderBottom: `1px solid ${c.border}`,
    },
    tooltipRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: c.textSecondary,
      fontSize: 10,
      marginBottom: 2,
    },
    tooltipDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
    },
    legend: {
      display: 'flex',
      justifyContent: 'center',
      gap: 16,
      padding: '8px 16px',
      borderTop: `1px solid ${c.border}`,
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 2,
    },
    legendLabel: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: 600,
    },
    loadingState: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: 'center',
      padding: 32,
    },
    emptyState: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: 'center',
      padding: 32,
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
}

export function ScanTrendWidget() {
  const token = useAuthStore((s) => s.token);
  const { colors } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const styles = getStyles(colors);

  useEffect(() => {
    apiRequest(ENDPOINTS.admin.statsTimeline(30), {}, token)
      .then((res) => { if (res.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>📈 Xu hướng quét (30 ngày)</span>
        </div>
        <div style={styles.loadingState}>Đang tải...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>📈 Xu hướng quét (30 ngày)</span>
        </div>
        <div style={styles.emptyState}>Chưa có dữ liệu</div>
      </div>
    );
  }

  const maxScans = Math.max(...data.map(d => d.scans), 1);
  const totalScans = data.reduce((sum, d) => sum + d.scans, 0);
  const totalDiseases = data.reduce((sum, d) => sum + d.diseases, 0);

  return (
    <div style={styles.container}>
      {/* Header with summary */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>📈 Xu hướng quét (30 ngày)</span>
        <div style={styles.headerStats}>
          <span style={styles.headerStat}>{totalScans} lần quét</span>
          <span style={styles.headerStatDot}>·</span>
          <span style={{ ...styles.headerStat, color: colors.warning }}>{totalDiseases} bệnh</span>
        </div>
      </div>

      {/* Chart area */}
      <div style={styles.chartArea}>
        {/* Y-axis labels */}
        <div style={styles.yAxis}>
          <span style={styles.yLabel}>{maxScans}</span>
          <span style={styles.yLabel}>{Math.round(maxScans / 2)}</span>
          <span style={styles.yLabel}>0</span>
        </div>

        {/* Bars */}
        <div style={styles.barsContainer}>
          {/* Grid lines */}
          <div style={{ ...styles.gridLine, bottom: '50%' }} />
          <div style={{ ...styles.gridLine, bottom: '100%' }} />

          {data.map((d, i) => {
            const height = maxScans > 0 ? (d.scans / maxScans) * 100 : 0;
            const diseaseHeight = maxScans > 0 ? (d.diseases / maxScans) * 100 : 0;
            const isHovered = hoveredIndex === i;
            const dayLabel = new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            return (
              <div
                key={i}
                style={styles.barGroup}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div style={styles.tooltip}>
                    <div style={styles.tooltipDate}>{dayLabel}</div>
                    <div style={styles.tooltipRow}>
                      <span style={{ ...styles.tooltipDot, background: colors.info }} />
                      <span>{d.scans} lần quét</span>
                    </div>
                    <div style={styles.tooltipRow}>
                      <span style={{ ...styles.tooltipDot, background: colors.warning }} />
                      <span>{d.diseases} bệnh</span>
                    </div>
                    <div style={styles.tooltipRow}>
                      <span style={{ ...styles.tooltipDot, background: colors.primaryGlow }} />
                      <span>{d.farmers} nông dân</span>
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div style={styles.barWrapper}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${height}%`,
                      backgroundColor: isHovered ? colors.info : `${colors.info}90`,
                      boxShadow: isHovered ? `0 0 12px ${colors.info}40` : 'none',
                    }}
                  />
                  {d.diseases > 0 && (
                    <div
                      style={{
                        ...styles.diseaseBar,
                        height: `${diseaseHeight}%`,
                        backgroundColor: isHovered ? colors.warning : `${colors.warning}80`,
                      }}
                    />
                  )}
                </div>

                {/* X-axis label (show every 5th) */}
                {i % 5 === 0 && (
                  <span style={styles.xLabel}>{dayLabel}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: colors.info }} />
          <span style={styles.legendLabel}>Lần quét</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: colors.warning }} />
          <span style={styles.legendLabel}>Bệnh phát hiện</span>
        </div>
      </div>
    </div>
  );
}

export default ScanTrendWidget;
