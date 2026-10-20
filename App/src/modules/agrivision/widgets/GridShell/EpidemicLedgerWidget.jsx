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
import { WIND_DIRECTIONS, getStyles } from './EpidemicLedgerStyles';

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
