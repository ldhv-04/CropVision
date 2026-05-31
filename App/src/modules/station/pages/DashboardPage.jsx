/**
 * DashboardPage — SoilzePro Dashboard
 *
 * Wireframe: soilzepro-research/markdown-wireframes.md (Dashboard)
 * Layout: KPI row + Chart row + Activity Feed
 *
 * Integrates existing Station features:
 * - Admin KPIs (users, samples, today's count, avg confidence)
 * - Disease frequency chart
 * - Recent activity feed
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../../@core/context/ThemeContext';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { useAdminStore } from '../../../modules/admin/store/useAdminStore';
import { SHADOWS } from '../../@core/constants/theme';

function KpiCard({ icon, label, value, subValue, color, colors }) {
  return (
    <div style={{
      flex: '1 1 200px',
      minWidth: 180,
      padding: '20px',
      borderRadius: 12,
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      boxShadow: SHADOWS.card,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: colors.textMuted,
          textTransform: 'uppercase', letterSpacing: 0.8,
        }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || colors.textPrimary, lineHeight: 1 }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>{subValue}</div>
      )}
    </div>
  );
}

function ChartCard({ title, children, colors }) {
  return (
    <div style={{
      flex: '1 1 400px',
      padding: '20px',
      borderRadius: 12,
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      boxShadow: SHADOWS.card,
    }}>
      <div style={{
        fontSize: 14, fontWeight: 700, color: colors.textPrimary,
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>📈</span> {title}
      </div>
      {children}
    </div>
  );
}

function DiseaseChart({ samples, colors }) {
  const diseaseCount = {};
  samples.forEach(s => {
    s.detections?.forEach(d => {
      if (d.disease_class) {
        diseaseCount[d.disease_class] = (diseaseCount[d.disease_class] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(diseaseCount).sort(([, a], [, b]) => b - a).slice(0, 8);
  if (sorted.length === 0) {
    return <div style={{ textAlign: 'center', color: colors.textMuted, padding: 24, fontSize: 13 }}>No disease data available</div>;
  }

  const maxVal = sorted[0][1];
  const barColors = [colors.danger, colors.warning, colors.info, colors.primaryGlow, colors.success, '#a78bfa', '#f472b6', '#fb923c'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map(([disease, count], idx) => {
        const pct = (count / maxVal) * 100;
        const barColor = barColors[idx % barColors.length];
        return (
          <div key={disease} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 120, fontSize: 11, color: colors.textSecondary, fontWeight: 500, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {disease.replace(/_/g, ' ')}
            </div>
            <div style={{ flex: 1, height: 10, backgroundColor: `${colors.border}40`, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: barColor, borderRadius: 5, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ width: 36, textAlign: 'right', fontSize: 12, fontWeight: 700, color: barColor }}>{count}</div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityFeed({ samples, colors }) {
  const recent = samples.slice(0, 8);

  if (recent.length === 0) {
    return <div style={{ textAlign: 'center', color: colors.textMuted, padding: 24, fontSize: 13 }}>No recent activity</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {recent.map((s, i) => {
        const topDisease = s.detections?.[0];
        const conf = topDisease ? Math.round(topDisease.confidence * 100) : null;
        const confColor = conf >= 70 ? colors.danger : conf >= 40 ? colors.warning : colors.success;

        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: i < recent.length - 1 ? `1px solid ${colors.border}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: confColor, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topDisease?.disease_class?.replace(/_/g, ' ') || 'No detection'}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  👤 {s.owner_name || s.owner_email} · {new Date(s.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
            {conf !== null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: confColor, flexShrink: 0, marginLeft: 12 }}>{conf}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { summary, samples, users, isLoading, isRefreshing, error, loadAdminData } = useAdminStore();

  useEffect(() => { loadAdminData(token); }, []);

  const recentSamples = samples.slice(0, 10);
  const todaySamples = samples.filter(s => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  let avgConf = null, totalConf = 0, confCount = 0;
  samples.forEach(s => {
    s.detections?.forEach(d => { totalConf += d.confidence; confCount++; });
  });
  if (confCount > 0) avgConf = Math.round((totalConf / confCount) * 100);

  if (isLoading && samples.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <ActivityIndicator color={colors.primaryGlow} size="large" />
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }} data-testid="dashboard-page">
      {error && (
        <div style={{
          padding: '12px 16px', backgroundColor: colors.dangerBg, borderRadius: 10,
          border: `1px solid ${colors.dangerBorder}`, color: colors.danger, fontSize: 13,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard icon="👥" label="Users" value={summary?.total_users ?? users.length} subValue="Registered" color={colors.info} colors={colors} />
        <KpiCard icon="🔬" label="Samples" value={summary?.total_samples ?? samples.length} subValue="Total analyzed" color={colors.primaryGlow} colors={colors} />
        <KpiCard icon="📅" label="Today" value={todaySamples.length} subValue="New samples" color={colors.success} colors={colors} />
        <KpiCard icon="🎯" label="Avg Confidence" value={avgConf !== null ? `${avgConf}%` : '—'} subValue="AI accuracy" color={avgConf >= 70 ? colors.success : avgConf >= 40 ? colors.warning : colors.danger} colors={colors} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <ChartCard title="Disease Frequency" colors={colors}>
          <DiseaseChart samples={samples} colors={colors} />
        </ChartCard>

        <ChartCard title="Recent Activity" colors={colors}>
          <ActivityFeed samples={samples} colors={colors} />
        </ChartCard>
      </div>

      {/* Alerts Summary */}
      <div style={{
        padding: '20px',
        borderRadius: 12,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        boxShadow: SHADOWS.card,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🚨</span> Active Alerts
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { icon: '🌡️', label: 'Temperature', value: '3 alerts', color: colors.warning },
            { icon: '💧', label: 'Moisture', value: '1 alert', color: colors.info },
            { icon: '🦠', label: 'Disease', value: '2 alerts', color: colors.danger },
            { icon: '🧪', label: 'pH Level', value: 'Normal', color: colors.success },
          ].map((alert, i) => (
            <div key={i} style={{
              flex: '1 1 150px', padding: '14px 16px', borderRadius: 10,
              backgroundColor: `${alert.color}10`, border: `1px solid ${alert.color}30`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{alert.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600 }}>{alert.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: alert.color }}>{alert.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}