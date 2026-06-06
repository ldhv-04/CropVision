/**
 * EpidemicLedgerWidget — Incident Ledger & Wind Compass Widget
 *
 * Renders:
 * - Active outbreak reports ledger (from /api/epidemic/outbreaks)
 * - Meteorology compass showing current wind vector (with manual override)
 * - Control sliders for danger dispersion radius
 * - Quick actions to trigger downwind simulation previews and resolve cases
 *
 * Theme-aware: uses useTheme() for dark mode commands center.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../@core/auth/useAuthStore';
import { useSubZoneStore } from '../../store/useSubZoneStore';
import { useTheme } from '../../../@core/context/ThemeContext';

const WIND_DIRECTIONS = [
  { value: 'N', label: 'Bắc (N)', angle: 0 },
  { value: 'NE', label: 'Đông Bắc (NE)', angle: 45 },
  { value: 'E', label: 'Đông (E)', angle: 90 },
  { value: 'SE', label: 'Đông Nam (SE)', angle: 135 },
  { value: 'S', label: 'Nam (S)', angle: 180 },
  { value: 'SW', label: 'Tây Nam (SW)', angle: 225 },
  { value: 'W', label: 'Tây (W)', angle: 270 },
  { value: 'NW', label: 'Tây Bắc (NW)', angle: 315 },
];

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
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 16px',
      borderBottom: `1px solid ${c.border}`,
      backgroundColor: `${c.surface}cc`,
    },
    headerIcon: { fontSize: 16 },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      flex: 1,
    },
    headerBadge: {
      backgroundColor: `${c.danger}20`,
      color: c.danger,
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 10,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    body: {
      flex: 1,
      overflowY: 'auto',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    compassCard: {
      backgroundColor: c.surfaceAlt,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    },
    compassTitle: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      alignSelf: 'flex-start',
    },
    compassRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      width: '100%',
    },
    compassCircle: {
      position: 'relative',
      width: 70,
      height: 70,
      borderRadius: '50%',
      border: `2px solid ${c.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    compassArrow: {
      width: 2,
      height: 40,
      backgroundColor: c.primaryGlow,
      position: 'relative',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      justifyContent: 'center',
    },
    compassArrowHead: {
      position: 'absolute',
      top: -6,
      width: 0,
      height: 0,
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderBottom: `8px solid ${c.primaryGlow}`,
    },
    compassLabel: {
      position: 'absolute',
      color: c.textMuted,
      fontSize: 9,
      fontWeight: 700,
    },
    compassControl: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    select: {
      backgroundColor: c.surface,
      color: c.textPrimary,
      border: `1px solid ${c.border}`,
      borderRadius: 6,
      padding: '4px 8px',
      fontSize: 11,
      cursor: 'pointer',
      outline: 'none',
    },
    sliderLabel: {
      color: c.textSecondary,
      fontSize: 10,
      display: 'flex',
      justifyContent: 'space-between',
    },
    slider: {
      width: '100%',
      cursor: 'pointer',
    },
    ledgerTitle: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 4,
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    outbreakCard: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      padding: 12,
      border: `1px solid ${c.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'border-color 0.2s',
    },
    outbreakCardActive: {
      borderColor: c.danger,
      boxShadow: `0 0 8px ${c.danger}20`,
    },
    outbreakHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    diseaseTitle: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: 700,
    },
    outbreakTime: {
      color: c.textMuted,
      fontSize: 9,
      whiteSpace: 'nowrap',
    },
    outbreakLoc: {
      color: c.textSecondary,
      fontSize: 10,
    },
    badgeRow: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
    },
    notifBadge: {
      backgroundColor: `${c.info}15`,
      color: c.info,
      fontSize: 9,
      padding: '1px 6px',
      borderRadius: 4,
      fontWeight: 600,
    },
    btnGroup: {
      display: 'flex',
      gap: 6,
      marginTop: 4,
    },
    btnPrimary: {
      flex: 1,
      backgroundColor: c.danger,
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      padding: '6px 0',
      fontSize: 10,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
    },
    btnSecondary: {
      flex: 1,
      backgroundColor: 'transparent',
      color: c.textSecondary,
      border: `1px solid ${c.border}`,
      borderRadius: 6,
      padding: '5px 0',
      fontSize: 10,
      fontWeight: 600,
      cursor: 'pointer',
    },
    btnActive: {
      backgroundColor: c.surface,
      borderColor: c.primaryGlow,
      color: c.primaryGlow,
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '24px 0',
      color: c.textMuted,
    },
  };
}

function timeAgo(dateString) {
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
}

export function EpidemicLedgerWidget() {
  const token = useAuthStore((s) => s.token);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const {
    outbreaks,
    simulationResult,
    fetchOutbreaks,
    runSimulation,
    clearSimulation,
    resolveOutbreak,
  } = useSubZoneStore();

  const [windDirection, setWindDirection] = useState('SE');
  const [dangerRadius, setDangerRadius] = useState(5.0);
  const [activeSimReportId, setActiveSimReportId] = useState(null);

  useEffect(() => {
    fetchOutbreaks(token);
  }, []);

  const handleSimulate = async (reportId) => {
    setActiveSimReportId(reportId);
    await runSimulation(token, {
      diseaseReportId: reportId,
      windDirection,
      dangerRadius: parseFloat(dangerRadius),
    });
  };

  const handleClearSimulation = () => {
    clearSimulation();
    setActiveSimReportId(null);
  };

  const handleResolve = async (reportId) => {
    const res = await resolveOutbreak(token, reportId);
    if (res.success) {
      if (activeSimReportId === reportId) {
        handleClearSimulation();
      }
      fetchOutbreaks(token);
    }
  };

  const activeCompassOption = WIND_DIRECTIONS.find(d => d.value === windDirection) || WIND_DIRECTIONS[3];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>🛰️</span>
        <span style={styles.headerTitle}>Sổ lâm sàng Dịch tễ</span>
        <span style={styles.headerBadge}>{outbreaks.length} ca</span>
      </div>

      <div style={styles.body}>
        {/* Meteorology Compass Widget */}
        <div style={styles.compassCard}>
          <span style={styles.compassTitle}>🧭 Khí tượng & Vector Gió</span>
          <div style={styles.compassRow}>
            {/* Compass Visual */}
            <div style={styles.compassCircle}>
              <span style={{ ...styles.compassLabel, top: 4 }}>N</span>
              <span style={{ ...styles.compassLabel, right: 6 }}>E</span>
              <span style={{ ...styles.compassLabel, bottom: 4 }}>S</span>
              <span style={{ ...styles.compassLabel, left: 6 }}>W</span>
              <div
                style={{
                  ...styles.compassArrow,
                  transform: `rotate(${activeCompassOption.angle}deg)`,
                }}
              >
                <div style={styles.compassArrowHead} />
              </div>
            </div>

            {/* Controls */}
            <div style={styles.compassControl}>
              <select
                style={styles.select}
                value={windDirection}
                onChange={(e) => setWindDirection(e.target.value)}
              >
                {WIND_DIRECTIONS.map(dir => (
                  <option key={dir.value} value={dir.value}>{dir.label}</option>
                ))}
              </select>

              <div style={styles.sliderLabel}>
                <span>Bán kính loang</span>
                <span style={{ fontWeight: '700' }}>{dangerRadius} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                style={styles.slider}
                value={dangerRadius}
                onChange={(e) => setDangerRadius(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Ledger Section */}
        <span style={styles.ledgerTitle}>📋 Ổ dịch đang hoạt động</span>
        <div style={styles.list}>
          {outbreaks.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 24 }}>🌿</span>
              <span style={{ fontSize: 11 }}>Không có ổ dịch nào đang hoạt động</span>
            </div>
          ) : (
            outbreaks.map((o) => {
              const isActiveSim = activeSimReportId === o.report_id;
              return (
                <div
                  key={o.report_id}
                  style={{
                    ...styles.outbreakCard,
                    ...(isActiveSim ? styles.outbreakCardActive : {}),
                  }}
                >
                  <div style={styles.outbreakHeader}>
                    <span style={styles.diseaseTitle}>
                      🚨 {o.disease_type?.replace(/_/g, ' ')}
                    </span>
                    <span style={styles.outbreakTime}>{timeAgo(o.reported_at)}</span>
                  </div>

                  <div style={styles.outbreakLoc}>
                    📍 {o.field_name} (Trồng: {o.crop_type})
                  </div>

                  <div style={styles.badgeRow}>
                    <span style={styles.notifBadge}>
                      📢 {o.alert_count} nông dân bị ảnh hưởng
                    </span>
                  </div>

                  <div style={styles.btnGroup}>
                    {isActiveSim ? (
                      <button
                        style={{ ...styles.btnSecondary, ...styles.btnActive }}
                        onClick={handleClearSimulation}
                      >
                        ⏹ Hủy mô phỏng
                      </button>
                    ) : (
                      <button
                        style={styles.btnSecondary}
                        onClick={() => handleSimulate(o.report_id)}
                      >
                        ▶ Mô phỏng
                      </button>
                    )}
                    <button
                      style={styles.btnPrimary}
                      onClick={() => handleResolve(o.report_id)}
                    >
                      ✓ Giải quyết
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default EpidemicLedgerWidget;
