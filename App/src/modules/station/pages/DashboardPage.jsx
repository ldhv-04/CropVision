/**
 * DashboardPage — Tactical Agronomy Mission Control
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * High-density operational telemetry dashboard.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { useAdminStore } from '../../../modules/admin/store/useAdminStore';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

function TelemetryKpiCard({ icon, code, label, value, subValue, color, accentBg }) {
  return (
    <div style={{
      flex: '1 1 210px',
      minWidth: 200,
      padding: '18px 20px',
      borderRadius: 8,
      backgroundColor: TACTICAL_THEME.bgPanel,
      border: `1px solid ${TACTICAL_THEME.border}`,
      boxShadow: TACTICAL_THEME.shadowPanel,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Corner indicator */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 32,
        height: 32,
        background: `linear-gradient(135deg, transparent 50%, ${color || TACTICAL_THEME.radar}25 50%)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, filter: `drop-shadow(0 0 8px ${color || TACTICAL_THEME.radar}60)` }}>{icon}</span>
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color: color || TACTICAL_THEME.radar,
            fontFamily: TACTICAL_THEME.fontMono,
            letterSpacing: '1px',
            backgroundColor: `${color || TACTICAL_THEME.radar}15`,
            padding: '2px 5px',
            borderRadius: 3,
          }}>{code}</span>
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: TACTICAL_THEME.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: TACTICAL_THEME.fontMono,
        }}>{label}</span>
      </div>

      <div style={{
        fontSize: 30,
        fontWeight: 900,
        color: color || TACTICAL_THEME.textPrimary,
        fontFamily: TACTICAL_THEME.fontMono,
        lineHeight: 1,
        letterSpacing: '-0.5px',
      }}>
        {value}
      </div>

      {subValue && (
        <div style={{
          fontSize: 10.5,
          color: TACTICAL_THEME.textSecondary,
          fontFamily: TACTICAL_THEME.fontMono,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: TACTICAL_THEME.textMuted }}>STATUS:</span>
          <span>{subValue}</span>
        </div>
      )}
    </div>
  );
}

function TacticalPanel({ title, subtitle, icon, children, badge }) {
  return (
    <div style={{
      flex: '1 1 420px',
      padding: '20px',
      borderRadius: 8,
      backgroundColor: TACTICAL_THEME.bgPanel,
      border: `1px solid ${TACTICAL_THEME.border}`,
      boxShadow: TACTICAL_THEME.shadowPanel,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        borderBottom: `1px solid ${TACTICAL_THEME.border}`,
        paddingBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: TACTICAL_THEME.textPrimary,
              fontFamily: TACTICAL_THEME.fontMono,
              letterSpacing: '0.6px',
            }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 10, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {badge && (
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color: TACTICAL_THEME.radar,
            backgroundColor: 'rgba(0, 245, 160, 0.12)',
            border: `1px solid ${TACTICAL_THEME.radar}`,
            padding: '3px 7px',
            borderRadius: 4,
            fontFamily: TACTICAL_THEME.fontMono,
          }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function DiseaseThreatSpectrum({ samples }) {
  const diseaseCount = {};
  samples.forEach((s) => {
    s.detections?.forEach((d) => {
      if (d.disease_class) {
        diseaseCount[d.disease_class] = (diseaseCount[d.disease_class] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(diseaseCount).sort(([, a], [, b]) => b - a).slice(0, 8);
  if (sorted.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: TACTICAL_THEME.textMuted,
        padding: 32,
        fontSize: 12,
        fontFamily: TACTICAL_THEME.fontMono,
      }}>
        [NO ACTIVE THREAT TELEMETRY DETECTED]
      </div>
    );
  }

  const maxVal = sorted[0][1];
  const spectrumColors = [
    TACTICAL_THEME.alert,
    TACTICAL_THEME.telemetry,
    TACTICAL_THEME.satellite,
    TACTICAL_THEME.radar,
    TACTICAL_THEME.violet,
    '#38BDF8',
    '#FB923C',
    '#F472B6',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map(([disease, count], idx) => {
        const pct = Math.round((count / maxVal) * 100);
        const barColor = spectrumColors[idx % spectrumColors.length];
        return (
          <div key={disease} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 11.5,
                color: TACTICAL_THEME.textPrimary,
                fontWeight: 600,
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: barColor }} />
                {disease.replace(/_/g, ' ')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: TACTICAL_THEME.fontMono }}>
                <span style={{ fontSize: 10, color: TACTICAL_THEME.textMuted }}>{pct}% OCCURRENCE</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: barColor,
                  backgroundColor: `${barColor}15`,
                  padding: '1px 5px',
                  borderRadius: 3,
                }}>
                  {count}
                </span>
              </div>
            </div>
            <div style={{
              height: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${TACTICAL_THEME.borderSubtle}`,
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                backgroundColor: barColor,
                boxShadow: `0 0 8px ${barColor}80`,
                borderRadius: 3,
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TacticalActivityFeed({ samples }) {
  const recent = samples.slice(0, 7);

  if (recent.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: TACTICAL_THEME.textMuted,
        padding: 32,
        fontSize: 12,
        fontFamily: TACTICAL_THEME.fontMono,
      }}>
        [NO RECENT RECONNAISSANCE LOGS]
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {recent.map((s, i) => {
        const topDisease = s.detections?.[0];
        const conf = topDisease ? Math.round(topDisease.confidence * 100) : null;
        const isCritical = conf && conf >= 70;
        const confColor = isCritical
          ? TACTICAL_THEME.alert
          : conf >= 40
            ? TACTICAL_THEME.telemetry
            : TACTICAL_THEME.radar;

        return (
          <div key={s.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 8px',
            borderRadius: 4,
            borderBottom: i < recent.length - 1 ? `1px solid ${TACTICAL_THEME.borderSubtle}` : 'none',
            backgroundColor: i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: confColor,
                boxShadow: `0 0 6px ${confColor}`,
                flexShrink: 0,
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: TACTICAL_THEME.textPrimary,
                  textTransform: 'capitalize',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {topDisease?.disease_class?.replace(/_/g, ' ') || 'Nominal Leaf Structure'}
                </div>
                <div style={{
                  fontSize: 9.5,
                  color: TACTICAL_THEME.textMuted,
                  marginTop: 2,
                  fontFamily: TACTICAL_THEME.fontMono,
                }}>
                  OP: {s.owner_name || s.owner_email || 'SCOUT'} · {new Date(s.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {conf !== null && (
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                fontFamily: TACTICAL_THEME.fontMono,
                color: confColor,
                backgroundColor: `${confColor}15`,
                padding: '2px 6px',
                borderRadius: 4,
                border: `1px solid ${confColor}40`,
                flexShrink: 0,
                marginLeft: 12,
              }}>
                {conf}% CONF
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const { summary, samples, users, isLoading, error, loadAdminData } = useAdminStore();

  useEffect(() => {
    loadAdminData(token);
  }, []);

  const todaySamples = samples.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  let avgConf = null;
  let totalConf = 0;
  let confCount = 0;
  samples.forEach((s) => {
    s.detections?.forEach((d) => {
      totalConf += d.confidence;
      confCount++;
    });
  });
  if (confCount > 0) avgConf = Math.round((totalConf / confCount) * 100);

  if (isLoading && samples.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
      }}>
        <ActivityIndicator color={TACTICAL_THEME.radar} size="large" />
        <div style={{ color: TACTICAL_THEME.radar, fontSize: 12, fontFamily: TACTICAL_THEME.fontMono }}>
          [SYNCHRONIZING TELEMETRY STREAMS...]
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }} data-testid="dashboard-page">
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: TACTICAL_THEME.alertMuted,
          borderRadius: 6,
          border: `1px solid ${TACTICAL_THEME.alert}`,
          color: TACTICAL_THEME.alert,
          fontSize: 12,
          fontFamily: TACTICAL_THEME.fontMono,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠ TELEMETRY FAULT:</span> {error}
        </div>
      )}

      {/* Telemetry KPI Metrics Grid */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <TelemetryKpiCard
          icon="👥"
          code="USR-METRIC"
          label="Registered Personnel"
          value={summary?.total_users ?? users.length}
          subValue="ACTIVE_AGRONOMISTS"
          color={TACTICAL_THEME.satellite}
        />
        <TelemetryKpiCard
          icon="🔬"
          code="SCN-TOTAL"
          label="Total Diagnoses"
          value={summary?.total_samples ?? samples.length}
          subValue="AI_DISCOVERIES"
          color={TACTICAL_THEME.radar}
        />
        <TelemetryKpiCard
          icon="📡"
          code="SCN-TODAY"
          label="Today's Field Recon"
          value={todaySamples.length}
          subValue="NEW_DISPATCHES"
          color={TACTICAL_THEME.telemetry}
        />
        <TelemetryKpiCard
          icon="🎯"
          code="AI-PRECISION"
          label="Avg Model Accuracy"
          value={avgConf !== null ? `${avgConf}%` : '—'}
          subValue="YOLOv8_CONFIDENCE"
          color={avgConf >= 70 ? TACTICAL_THEME.radar : avgConf >= 40 ? TACTICAL_THEME.telemetry : TACTICAL_THEME.alert}
        />
      </div>

      {/* Main Operations Radar & Activity Split */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <TacticalPanel
          title="EPIDEMIC THREAT SPECTRUM"
          subtitle="Frequency distribution of detected pathologies"
          icon="📊"
          badge="SPECTRUM ANALYZER"
        >
          <DiseaseThreatSpectrum samples={samples} />
        </TacticalPanel>

        <TacticalPanel
          title="FIELD RECONNAISSANCE LOGS"
          subtitle="Real-time optical diagnostic events"
          icon="📡"
          badge="LIVE TELEMETRY"
        >
          <TacticalActivityFeed samples={samples} />
        </TacticalPanel>
      </div>

      {/* Active Sensor Threat Matrices */}
      <div style={{
        padding: '20px',
        borderRadius: 8,
        backgroundColor: TACTICAL_THEME.bgPanel,
        border: `1px solid ${TACTICAL_THEME.border}`,
        boxShadow: TACTICAL_THEME.shadowPanel,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          borderBottom: `1px solid ${TACTICAL_THEME.border}`,
          paddingBottom: 10,
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: TACTICAL_THEME.textPrimary,
            fontFamily: TACTICAL_THEME.fontMono,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>⚡</span> SENSOR THREAT VECTORS & ACTIVE INCIDENTS
          </div>
          <span style={{
            fontSize: 9,
            color: TACTICAL_THEME.radar,
            fontFamily: TACTICAL_THEME.fontMono,
            fontWeight: 700,
          }}>
            4 ZONES MONITORED
          </span>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { icon: '🌡️', label: 'Canopy Heat Vector', value: '3 Active Alerts', level: 'ELEVATED', color: TACTICAL_THEME.telemetry },
            { icon: '💧', label: 'Soil Moisture Stress', value: '1 Active Alert', level: 'MONITORING', color: TACTICAL_THEME.satellite },
            { icon: '🦠', label: 'Spore Dispersion Risk', value: '2 High Threat', level: 'CRITICAL', color: TACTICAL_THEME.alert },
            { icon: '🧪', label: 'Soil pH & Nitrogen Balance', value: 'Nominal Range', level: 'STABLE', color: TACTICAL_THEME.radar },
          ].map((alert, i) => (
            <div key={i} style={{
              flex: '1 1 180px',
              padding: '12px 14px',
              borderRadius: 6,
              backgroundColor: `${alert.color}0A`,
              border: `1px solid ${alert.color}35`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{alert.icon}</span>
                <div>
                  <div style={{ fontSize: 10, color: TACTICAL_THEME.textMuted, fontWeight: 700, fontFamily: TACTICAL_THEME.fontMono }}>
                    {alert.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TACTICAL_THEME.textPrimary }}>
                    {alert.value}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 8,
                fontWeight: 800,
                color: alert.color,
                fontFamily: TACTICAL_THEME.fontMono,
                backgroundColor: `${alert.color}15`,
                padding: '2px 5px',
                borderRadius: 3,
              }}>
                {alert.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
