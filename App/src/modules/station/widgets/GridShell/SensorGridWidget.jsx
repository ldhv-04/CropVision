/**
 * SensorGridWidget — IoT Telemetry Sensor Card Grid
 *
 * Displays connected field sensors in a responsive card grid.
 * Each card shows:
 *   - Sensor name + location
 *   - Status badge (Active / Offline / Alert)
 *   - Battery percentage with color indicator
 *   - Current readings (Moisture, Temp, pH, EC)
 *   - Mini sparkline chart (24h trend via inline SVG path)
 *
 * Data: Static mock sensors for demonstration.
 * Integration: Replace MOCK_SENSORS with API call to /api/sensors
 */

import { useState } from 'react';
import { useTheme } from '../../../@core/context/ThemeContext';

// ── Mock sensor data ─────────────────────────────────────────────────────────
const MOCK_SENSORS = [
  {
    id: 'S01', name: 'Cảm biến A1', location: 'Khu A1 – Ngô',
    status: 'active', battery: 85,
    readings: { moisture: 72, temp: 28.4, ph: 6.4, ec: 1.8 },
    trend: [65, 68, 71, 74, 72, 70, 73, 72, 74, 72], // 24h moisture trend
  },
  {
    id: 'S02', name: 'Cảm biến A2', location: 'Khu A2 – Lúa',
    status: 'alert', battery: 23,
    readings: { moisture: 88, temp: 30.1, ph: 6.1, ec: 2.1 },
    trend: [80, 83, 86, 88, 87, 90, 88, 91, 88, 88],
  },
  {
    id: 'S03', name: 'Cảm biến A3', location: 'Khu A3 – Cà chua',
    status: 'active', battery: 61,
    readings: { moisture: 65, temp: 27.8, ph: 6.8, ec: 1.5 },
    trend: [70, 68, 67, 65, 66, 64, 65, 63, 65, 65],
  },
  {
    id: 'S04', name: 'Cảm biến B1', location: 'Khu B1 – Khoai',
    status: 'offline', battery: 0,
    readings: { moisture: null, temp: null, ph: null, ec: null },
    trend: [78, 78, 78, 78, 78, null, null, null, null, null],
  },
  {
    id: 'S05', name: 'Cảm biến B2', location: 'Khu B2 – Dưa',
    status: 'active', battery: 92,
    readings: { moisture: 55, temp: 29.2, ph: 6.6, ec: 1.6 },
    trend: [58, 57, 56, 55, 56, 54, 55, 53, 55, 55],
  },
  {
    id: 'S06', name: 'Cảm biến C1', location: 'Khu C1 – Rau',
    status: 'active', battery: 78,
    readings: { moisture: 80, temp: 26.5, ph: 7.0, ec: 1.2 },
    trend: [76, 77, 78, 80, 79, 81, 80, 82, 80, 80],
  },
];

/** Inline SVG sparkline for 24h trend */
function Sparkline({ data, color, width = 80, height = 28 }) {
  const validData = data.filter((v) => v !== null && v !== undefined);
  if (validData.length < 2) {
    return <svg width={width} height={height} />;
  }
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      if (v === null || v === undefined) return null;
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <svg width={width} height={height}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function StatusBadge({ status, colors }) {
  const map = {
    active:  { label: '● Hoạt động', bg: colors.successBg, color: colors.success, border: colors.successBorder },
    alert:   { label: '⚠ Cảnh báo',  bg: colors.warningBg, color: colors.warning, border: colors.warningBorder },
    offline: { label: '○ Ngoại tuyến', bg: `${colors.danger}18`, color: colors.danger, border: colors.dangerBorder },
  };
  const s = map[status] || map.offline;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

function BatteryBar({ pct, colors }) {
  const color = pct > 50 ? colors.success : pct > 20 ? colors.warning : colors.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 28, height: 12, borderRadius: 3,
        border: `1px solid ${color}`, position: 'relative',
        display: 'flex', alignItems: 'center', padding: 1,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 2,
          backgroundColor: color, transition: 'width 0.5s',
        }} />
        {/* Battery tip */}
        <div style={{
          position: 'absolute', right: -4, top: '25%',
          width: 3, height: '50%', borderRadius: '0 2px 2px 0',
          backgroundColor: color,
        }} />
      </div>
      <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{pct}%</span>
    </div>
  );
}

function SensorCard({ sensor, colors }) {
  const isOffline = sensor.status === 'offline';
  const textColor = isOffline ? colors.textMuted : colors.textPrimary;
  const trendColor = sensor.status === 'alert' ? colors.warning : colors.primaryGlow;

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 12,
      border: `1px solid ${sensor.status === 'alert'
        ? colors.warningBorder : colors.border}`,
      backgroundColor: colors.surfaceAlt,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      boxShadow: sensor.status === 'alert'
        ? `0 0 12px ${colors.warning}22` : 'none',
      transition: 'transform 0.15s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: textColor }}>
            {sensor.name}
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted }}>{sensor.location}</div>
        </div>
        <StatusBadge status={sensor.status} colors={colors} />
      </div>

      {/* Readings grid */}
      {!isOffline ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
          {[
            { icon: '💧', label: 'Ẩm độ', val: `${sensor.readings.moisture}%` },
            { icon: '🌡️', label: 'Nhiệt độ', val: `${sensor.readings.temp}°C` },
            { icon: '⚗️', label: 'pH', val: `${sensor.readings.ph}` },
            { icon: '⚡', label: 'EC', val: `${sensor.readings.ec} dS/m` },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ fontSize: 10, color: colors.textSecondary }}>
              {icon} <span style={{ color: textColor, fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
          Không có kết nối tín hiệu
        </div>
      )}

      {/* Sparkline + Battery */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Sparkline data={sensor.trend} color={trendColor} />
        <BatteryBar pct={sensor.battery} colors={colors} />
      </div>
    </div>
  );
}

export function SensorGridWidget() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all',    label: 'Tất cả' },
    { key: 'active', label: '● Hoạt động' },
    { key: 'alert',  label: '⚠ Cảnh báo' },
    { key: 'offline',label: '○ Ngoại tuyến' },
  ];

  const visible = filter === 'all'
    ? MOCK_SENSORS
    : MOCK_SENSORS.filter((s) => s.status === filter);

  const alertCount = MOCK_SENSORS.filter((s) => s.status === 'alert').length;

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: colors.surface, boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px 8px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
            📡 Cảm biến IoT
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>
            {MOCK_SENSORS.length} thiết bị được kết nối
          </div>
        </div>
        {alertCount > 0 && (
          <div style={{
            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            backgroundColor: colors.warningBg, color: colors.warning,
            border: `1px solid ${colors.warningBorder}`,
          }}>
            ⚠ {alertCount} cảnh báo
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{
        padding: '6px 14px', borderBottom: `1px solid ${colors.border}`,
        display: 'flex', gap: 4,
      }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1px solid ${filter === f.key ? colors.primaryGlow : colors.border}`,
              backgroundColor: filter === f.key ? `${colors.primary}28` : 'transparent',
              color: filter === f.key ? colors.primaryGlow : colors.textSecondary,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sensor card grid */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 8,
        alignContent: 'start',
      }}>
        {visible.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} colors={colors} />
        ))}
        {visible.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center',
            padding: 24, color: colors.textMuted, fontSize: 13,
          }}>
            Không có cảm biến nào phù hợp bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
}

export default SensorGridWidget;
