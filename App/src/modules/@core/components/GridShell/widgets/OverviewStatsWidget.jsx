/**
 * OverviewStatsWidget — Smart Farming KPI Dashboard Row
 *
 * Displays 4 key performance indicators in a horizontal card grid:
 *   1. Soil Health Score  — 0-100 composite score with circular gauge
 *   2. Disease Risk       — YOLO detection confidence-weighted risk
 *   3. Active Samples     — Total inference samples in this session
 *   4. AI Consultations   — Chat sessions initiated
 *
 * Data sources:
 *   - useInferenceStore (detections, sampleId)
 *   - Local session counters (stateless mock for non-connected state)
 *
 * Fully themed via useTheme().
 */

import { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useInferenceStore } from '../../../../inference/store/useInferenceStore';

/** Circular SVG gauge for the health score */
function GaugeRing({ value, max = 100, color, size = 52 }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDash = circumference * progress;

  return (
    <svg width={size} height={size} viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx="26" cy="26" r={radius} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      {/* Progress */}
      <circle cx="26" cy="26" r={radius} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Center text — rotated back */}
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="800"
        fill={color} style={{ transform: 'rotate(90deg)', transformOrigin: '26px 26px' }}>
        {value}
      </text>
    </svg>
  );
}

/** Single KPI card */
function KpiCard({ icon, label, value, unit = '', sub, gaugeValue, color, colors }) {
  const cardStyle = {
    flex: 1,
    minWidth: 0,
    padding: '16px 18px',
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surfaceAlt,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
    transition: 'transform 0.15s, box-shadow 0.2s',
    cursor: 'default',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: color || colors.textPrimary }}>
              {value}
            </span>
            {unit && (
              <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
                {unit}
              </span>
            )}
          </div>
        </div>
        {gaugeValue !== undefined
          ? <GaugeRing value={gaugeValue} color={color} />
          : <span style={{ fontSize: 28 }}>{icon}</span>
        }
      </div>

      {/* Sub-label */}
      {sub && (
        <div style={{ fontSize: 11, color: colors.textSecondary }}>{sub}</div>
      )}
    </div>
  );
}

export function OverviewStatsWidget() {
  const { colors } = useTheme();
  const { detections, sampleId } = useInferenceStore();

  // Derived metrics from current session
  const kpis = useMemo(() => {
    const count = detections?.length || 0;

    // Soil Health: inverse of average disease confidence (higher confidence → more disease → lower health)
    const avgConfidence = count > 0
      ? detections.reduce((s, d) => s + d.confidence, 0) / count
      : 0;
    const soilHealth = count > 0 ? Math.round((1 - avgConfidence * 0.7) * 100) : 88;
    const healthColor = soilHealth >= 75 ? colors.success
      : soilHealth >= 50 ? colors.warning : colors.danger;

    // Disease risk (highest single detection)
    const maxConf = count > 0
      ? Math.max(...detections.map((d) => d.confidence))
      : 0;
    const riskPct = Math.round(maxConf * 100);
    const riskColor = riskPct >= 70 ? colors.danger
      : riskPct >= 40 ? colors.warning : colors.success;

    return [
      {
        label: 'Chỉ số sức khỏe đất',
        value: soilHealth,
        unit: '/100',
        sub: soilHealth >= 75 ? '✅ Tốt' : soilHealth >= 50 ? '⚠️ Trung bình' : '🚨 Cần xử lý',
        gaugeValue: soilHealth,
        color: healthColor,
      },
      {
        label: 'Nguy cơ dịch bệnh',
        value: riskPct,
        unit: '%',
        sub: count > 0 ? `${count} bệnh phát hiện` : 'Chưa có mẫu phân tích',
        icon: riskPct >= 70 ? '🚨' : riskPct >= 40 ? '⚠️' : '✅',
        color: riskColor,
      },
      {
        label: 'Mẫu vật phân tích',
        value: sampleId ? 1 : 0,
        unit: 'mẫu',
        sub: sampleId ? `ID: ${String(sampleId).slice(0, 8)}…` : 'Chưa tải ảnh lên',
        icon: '🔬',
        color: colors.info,
      },
      {
        label: 'Phát hiện bệnh',
        value: count,
        unit: 'loại',
        sub: count > 0
          ? detections[0]?.class_name
          : 'Không phát hiện bệnh',
        icon: '🧬',
        color: colors.primaryGlow,
      },
    ];
  }, [detections, sampleId, colors]);

  return (
    <div style={{
      padding: '12px 14px',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
            Tổng quan nông trại
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            Chỉ số sức khỏe thời gian thực
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          backgroundColor: colors.successBg, color: colors.success,
          border: `1px solid ${colors.successBorder}`,
        }}>
          🟢 Trực tuyến
        </div>
      </div>

      {/* KPI cards row */}
      <div style={{ display: 'flex', gap: 10, flex: 1 }}>
        {kpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} colors={colors} />
        ))}
      </div>
    </div>
  );
}
