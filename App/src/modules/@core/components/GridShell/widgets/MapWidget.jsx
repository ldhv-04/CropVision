/**
 * MapWidget — Interactive SVG Farm Field Map
 *
 * Displays an interactive vector map dividing the farm into
 * clickable field segments, color-coded by health status.
 *
 * Architecture:
 *   - Renders a modular SVG with predefined polygon zones
 *   - Each zone has hover tooltip showing soil metrics
 *   - Heatmap toggle: Moisture / pH / Disease Risk / Default
 *   - Prepared for GeoJSON data: replace FIELD_ZONES with
 *     parsed GeoJSON features when backend provides them
 *
 * Data integration:
 *   - useInferenceStore: applies disease risk overlay when
 *     detections are present
 *   - Future: connect to /api/sensors/fields for live soil data
 */

import { useState, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useInferenceStore } from '../../../../inference/store/useInferenceStore';

// ── Field zone definitions (replace with GeoJSON parser when available) ──────
// Each zone: { id, label, path (SVG path d attr), metrics }
const FIELD_ZONES = [
  {
    id: 'A1', label: 'Khu A1 – Ngô',
    // SVG polygon coordinates (viewBox 0 0 600 400)
    points: '30,30 180,30 180,160 30,160',
    metrics: { moisture: 72, ph: 6.4, nitrogen: 85, risk: 15 },
  },
  {
    id: 'A2', label: 'Khu A2 – Lúa',
    points: '190,30 340,30 340,160 190,160',
    metrics: { moisture: 88, ph: 6.1, nitrogen: 70, risk: 42 },
  },
  {
    id: 'A3', label: 'Khu A3 – Cà chua',
    points: '350,30 500,30 500,160 350,160',
    metrics: { moisture: 65, ph: 6.8, nitrogen: 90, risk: 68 },
  },
  {
    id: 'B1', label: 'Khu B1 – Khoai lang',
    points: '30,170 230,170 230,310 30,310',
    metrics: { moisture: 78, ph: 5.9, nitrogen: 60, risk: 22 },
  },
  {
    id: 'B2', label: 'Khu B2 – Dưa hấu',
    points: '240,170 500,170 500,310 240,310',
    metrics: { moisture: 55, ph: 6.6, nitrogen: 75, risk: 35 },
  },
  {
    id: 'C1', label: 'Khu C1 – Rau cải',
    points: '30,320 280,320 280,380 30,380',
    metrics: { moisture: 80, ph: 7.0, nitrogen: 95, risk: 8 },
  },
  {
    id: 'C2', label: 'Khu C2 – Ớt',
    points: '290,320 500,320 500,380 290,380',
    metrics: { moisture: 62, ph: 6.3, nitrogen: 80, risk: 55 },
  },
];

const HEATMAP_MODES = [
  { key: 'risk',     label: '🦠 Bệnh',     metric: 'risk',     invert: false },
  { key: 'moisture', label: '💧 Ẩm độ',    metric: 'moisture', invert: false },
  { key: 'ph',       label: '⚗️ pH',       metric: 'ph',       invert: false, max: 14 },
  { key: 'nitrogen', label: '🌿 Nitơ',     metric: 'nitrogen', invert: false },
];

function getZoneColor(value, mode, colors, max = 100) {
  const pct = Math.min(value / max, 1);
  if (mode.key === 'risk') {
    // High risk → danger, low risk → success
    if (pct >= 0.65) return colors.danger;
    if (pct >= 0.35) return colors.warning;
    return colors.success;
  }
  // For moisture/nitrogen/ph: higher = healthier
  if (pct >= 0.7)  return colors.success;
  if (pct >= 0.45) return colors.warning;
  return colors.danger;
}

export function MapWidget() {
  const { colors }  = useTheme();
  const { detections } = useInferenceStore();

  const [hoverZone, setHoverZone]   = useState(null);
  const [activeMode, setActiveMode] = useState(HEATMAP_MODES[0]);
  const [selectedZone, setSelected] = useState(null);

  const handleZoneClick = useCallback((zone) => {
    setSelected((prev) => prev?.id === zone.id ? null : zone);
  }, []);

  // If detections present, boost risk in A3/C2 for demo
  const getRisk = useCallback((zone) => {
    if (detections?.length > 0 && (zone.id === 'A3' || zone.id === 'C2')) {
      return Math.min(zone.metrics.risk + detections.length * 8, 95);
    }
    return zone.metrics.risk;
  }, [detections]);

  const getMetricValue = useCallback((zone, mode) => {
    if (mode.key === 'risk') return getRisk(zone);
    return zone.metrics[mode.metric] ?? 50;
  }, [getRisk]);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: colors.surface, boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px 8px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
            🗺️ Bản đồ cánh đồng
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>
            Bấm vào khu vực để xem chi tiết
          </div>
        </div>
        {/* Heatmap mode toggles */}
        <div style={{ display: 'flex', gap: 4 }}>
          {HEATMAP_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setActiveMode(mode)}
              style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: `1px solid ${activeMode.key === mode.key ? colors.primaryGlow : colors.border}`,
                backgroundColor: activeMode.key === mode.key
                  ? `${colors.primary}30` : 'transparent',
                color: activeMode.key === mode.key ? colors.primaryGlow : colors.textSecondary,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map + Info Panel */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Map */}
        <div style={{ flex: 1, padding: 12, position: 'relative' }}>
          <svg
            viewBox="0 0 530 410"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none"
                  stroke={colors.border} strokeWidth="0.5" opacity="0.4"/>
              </pattern>
            </defs>
            <rect width="530" height="410" fill="url(#grid)" />

            {/* Field zones */}
            {FIELD_ZONES.map((zone) => {
              const metric = getMetricValue(zone, activeMode);
              const max = activeMode.key === 'ph' ? 14 : 100;
              const fill = getZoneColor(metric, activeMode, colors, max);
              const isHovered = hoverZone?.id === zone.id;
              const isSelected = selectedZone?.id === zone.id;

              return (
                <g key={zone.id}>
                  <polygon
                    points={zone.points}
                    fill={fill}
                    fillOpacity={isHovered || isSelected ? 0.75 : 0.45}
                    stroke={isSelected ? colors.primaryGlow : fill}
                    strokeWidth={isSelected ? 2.5 : 1}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={() => setHoverZone(zone)}
                    onMouseLeave={() => setHoverZone(null)}
                    onClick={() => handleZoneClick(zone)}
                  />
                  {/* Zone label */}
                  <text
                    x={zone.points.split(' ').map(p => +p.split(',')[0]).reduce((a,b) => a+b,0) /
                       zone.points.split(' ').length}
                    y={zone.points.split(' ').map(p => +p.split(',')[1]).reduce((a,b) => a+b,0) /
                       zone.points.split(' ').length + 4}
                    textAnchor="middle" fontSize="11" fontWeight="700"
                    fill={colors.textPrimary} opacity="0.9"
                    style={{ pointerEvents: 'none' }}
                  >
                    {zone.id}
                  </text>
                  {/* Metric value badge */}
                  <text
                    x={zone.points.split(' ').map(p => +p.split(',')[0]).reduce((a,b) => a+b,0) /
                       zone.points.split(' ').length}
                    y={zone.points.split(' ').map(p => +p.split(',')[1]).reduce((a,b) => a+b,0) /
                       zone.points.split(' ').length + 18}
                    textAnchor="middle" fontSize="9"
                    fill={colors.textSecondary} opacity="0.8"
                    style={{ pointerEvents: 'none' }}
                  >
                    {activeMode.key === 'ph'
                      ? `pH ${metric}`
                      : `${metric}${activeMode.key === 'risk' ? '%⚠' : '%'}`
                    }
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoverZone && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              backgroundColor: colors.surfaceAlt,
              border: `1px solid ${colors.borderStrong}`,
              borderRadius: 10, padding: '8px 12px',
              fontSize: 12, color: colors.textPrimary,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{hoverZone.label}</div>
              <div style={{ color: colors.textSecondary }}>
                💧 Ẩm: {hoverZone.metrics.moisture}% &nbsp;
                ⚗️ pH: {hoverZone.metrics.ph} &nbsp;
                🌿 N: {hoverZone.metrics.nitrogen}%
              </div>
            </div>
          )}
        </div>

        {/* Selected zone detail panel */}
        {selectedZone && (
          <div style={{
            width: 170, padding: 14, borderLeft: `1px solid ${colors.border}`,
            backgroundColor: colors.surfaceAlt, display: 'flex',
            flexDirection: 'column', gap: 10, overflowY: 'auto',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
                {selectedZone.label}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                Chi tiết cánh đồng
              </div>
            </div>
            {[
              { label: '💧 Ẩm độ đất', value: `${selectedZone.metrics.moisture}%`,
                color: colors.info },
              { label: '⚗️ Độ pH',     value: `${selectedZone.metrics.ph}`,
                color: colors.primaryGlow },
              { label: '🌿 Nitơ',       value: `${selectedZone.metrics.nitrogen}%`,
                color: colors.success },
              { label: '🦠 Nguy cơ bệnh', value: `${getRisk(selectedZone)}%`,
                color: getRisk(selectedZone) > 60 ? colors.danger : colors.warning },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '8px 10px', borderRadius: 10,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
              }}>
                <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>
                  {value}
                </div>
              </div>
            ))}
            <button
              onClick={() => setSelected(null)}
              style={{
                marginTop: 'auto', padding: '7px', borderRadius: 8,
                border: `1px solid ${colors.border}`, backgroundColor: 'transparent',
                color: colors.textSecondary, fontSize: 12, cursor: 'pointer',
              }}
            >
              Đóng ✕
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: '6px 16px', borderTop: `1px solid ${colors.border}`,
        display: 'flex', gap: 16, alignItems: 'center',
        fontSize: 11, color: colors.textSecondary,
      }}>
        <span style={{ fontWeight: 600, color: colors.textMuted }}>Chú giải:</span>
        {[
          { color: colors.success, label: 'Tốt' },
          { color: colors.warning, label: 'Trung bình' },
          { color: colors.danger,  label: 'Cần xử lý' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: colors.textMuted, fontStyle: 'italic' }}>
          GeoJSON-ready
        </span>
      </div>
    </div>
  );
}
