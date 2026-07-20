/**
 * SensorsPage — SoilzePro IoT Sensors
 *
 * Wireframe: soilzepro-research/markdown-wireframes.md (IoT Sensors)
 * Grid of sensor cards with real-time readings
 */

import { useState } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';
import { SHADOWS } from '../../@core/constants/theme';

const MOCK_SENSORS = [
  { id: 1, name: 'Temp Sensor A1', type: 'temperature', field: 'Field Alpha', value: 32.5, unit: '°C', status: 'normal', icon: '🌡️', history: [28, 30, 31, 33, 32, 32.5] },
  { id: 2, name: 'Moisture Sensor B2', type: 'moisture', field: 'Field Beta', value: 65, unit: '%', status: 'normal', icon: '💧', history: [60, 62, 68, 70, 67, 65] },
  { id: 3, name: 'pH Sensor C1', type: 'ph', field: 'Field Gamma', value: 5.2, unit: 'pH', status: 'warning', icon: '🧪', history: [6.0, 5.8, 5.5, 5.3, 5.2, 5.2] },
  { id: 4, name: 'Temp Sensor A2', type: 'temperature', field: 'Field Alpha', value: 38.1, unit: '°C', status: 'danger', icon: '🌡️', history: [32, 34, 35, 36, 37, 38.1] },
  { id: 5, name: 'NPK Sensor D1', type: 'npk', field: 'Field Delta', value: 45, unit: 'ppm', status: 'normal', icon: '🌱', history: [40, 42, 43, 44, 45, 45] },
  { id: 6, name: 'Moisture Sensor E1', type: 'moisture', field: 'Field Epsilon', value: 28, unit: '%', status: 'danger', icon: '💧', history: [55, 48, 42, 38, 33, 28] },
  { id: 7, name: 'Light Sensor A3', type: 'light', field: 'Field Alpha', value: 850, unit: 'lux', status: 'normal', icon: '☀️', history: [800, 820, 840, 850, 845, 850] },
  { id: 8, name: 'Wind Sensor B3', type: 'wind', field: 'Field Beta', value: 12, unit: 'km/h', status: 'normal', icon: '💨', history: [8, 10, 11, 14, 13, 12] },
];

const STATUS_COLORS = {
  normal: '#4ade80',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const FILTER_TYPES = ['all', 'temperature', 'moisture', 'ph', 'npk', 'light', 'wind'];

export default function SensorsPage() {
  const { colors } = useTheme();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  const filtered = MOCK_SENSORS.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const MiniChart = ({ history, color }) => {
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;
    const h = 40;
    const w = 120;
    const points = history.map((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const SensorCard = ({ sensor }) => {
    const statusColor = STATUS_COLORS[sensor.status];
    const isSelected = selectedSensor?.id === sensor.id;

    return (
      <div
        onClick={() => setSelectedSensor(isSelected ? null : sensor)}
        style={{
          padding: '20px',
          borderRadius: 12,
          backgroundColor: colors.surface,
          border: `1px solid ${isSelected ? colors.primary : colors.border}`,
          boxShadow: isSelected ? SHADOWS.glow : SHADOWS.card,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primary; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = colors.border; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{sensor.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{sensor.name}</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{sensor.field}</div>
            </div>
          </div>
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: statusColor,
            boxShadow: sensor.status === 'danger' ? `0 0 8px ${statusColor}60` : 'none',
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: statusColor, lineHeight: 1 }}>
              {sensor.value}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, marginTop: 4 }}>{sensor.unit}</div>
          </div>
          <MiniChart history={sensor.history} color={statusColor} />
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 8, borderTop: `1px solid ${colors.border}`,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: statusColor,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {sensor.status}
          </span>
          <span style={{ fontSize: 10, color: colors.textMuted }}>Updated 2m ago</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="sensors-page">
      {/* Filters & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_TYPES.map(type => (
            <button key={type} onClick={() => setFilterType(type)} style={{
              padding: '6px 12px', borderRadius: 8,
              border: `1px solid ${filterType === type ? colors.primary : colors.border}`,
              backgroundColor: filterType === type ? `${colors.primary}20` : 'transparent',
              color: filterType === type ? colors.primaryGlow : colors.textSecondary,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
              textTransform: 'capitalize',
            }}>
              {type}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['grid', 'table'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '6px 12px', borderRadius: 8,
              border: `1px solid ${viewMode === mode ? colors.primary : colors.border}`,
              backgroundColor: viewMode === mode ? `${colors.primary}20` : 'transparent',
              color: viewMode === mode ? colors.primaryGlow : colors.textSecondary,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
              textTransform: 'capitalize',
            }}>
              {mode === 'grid' ? '▦ Grid' : '≡ Table'}
            </button>
          ))}
        </div>
      </div>

      {/* Status Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Sensors', value: MOCK_SENSORS.length, icon: '📡', color: colors.info },
          { label: 'Normal', value: MOCK_SENSORS.filter(s => s.status === 'normal').length, icon: '✅', color: colors.success },
          { label: 'Warning', value: MOCK_SENSORS.filter(s => s.status === 'warning').length, icon: '⚠️', color: colors.warning },
          { label: 'Critical', value: MOCK_SENSORS.filter(s => s.status === 'danger').length, icon: '🚨', color: colors.danger },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: '1 1 150px', padding: '14px 16px', borderRadius: 10,
            backgroundColor: `${stat.color}10`, border: `1px solid ${stat.color}30`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sensor Grid */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(sensor => <SensorCard key={sensor.id} sensor={sensor} />)}
        </div>
      ) : (
        <div style={{
          borderRadius: 12, overflow: 'hidden',
          backgroundColor: colors.surface, border: `1px solid ${colors.border}`,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", "Outfit", system-ui, sans-serif' }}>
            <thead>
              <tr style={{ backgroundColor: colors.surfaceHover }}>
                {['Sensor', 'Field', 'Type', 'Value', 'Status', 'Last Update'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sensor => (
                <tr key={sensor.id} style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
                  onClick={() => setSelectedSensor(sensor)}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                    <span style={{ marginRight: 8 }}>{sensor.icon}</span>{sensor.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{sensor.field}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' }}>{sensor.type}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: STATUS_COLORS[sensor.status] }}>{sensor.value} {sensor.unit}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      backgroundColor: `${STATUS_COLORS[sensor.status]}20`,
                      color: STATUS_COLORS[sensor.status],
                      textTransform: 'uppercase',
                    }}>{sensor.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: colors.textMuted }}>2 min ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}