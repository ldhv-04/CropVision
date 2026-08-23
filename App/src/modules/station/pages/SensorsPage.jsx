/**
 * SensorsPage — Tactical IoT Telemetry Matrix
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Real-time hardware telemetry streams with live spark-meters.
 */

import React, { useState } from 'react';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

const MOCK_SENSORS = [
  { id: 1, name: 'Canopy Temp Probe A1', type: 'temperature', field: 'Sector Alpha', value: 32.5, unit: '°C', status: 'normal', icon: '🌡️', history: [28, 30, 31, 33, 32, 32.5] },
  { id: 2, name: 'Soil Moisture Matrix B2', type: 'moisture', field: 'Sector Beta', value: 65, unit: '%', status: 'normal', icon: '💧', history: [60, 62, 68, 70, 67, 65] },
  { id: 3, name: 'Rhizosphere pH Meter C1', type: 'ph', field: 'Sector Gamma', value: 5.2, unit: 'pH', status: 'warning', icon: '🧪', history: [6.0, 5.8, 5.5, 5.3, 5.2, 5.2] },
  { id: 4, name: 'Thermal Canopy Sensor A2', type: 'temperature', field: 'Sector Alpha', value: 38.1, unit: '°C', status: 'danger', icon: '🌡️', history: [32, 34, 35, 36, 37, 38.1] },
  { id: 5, name: 'NPK Optical Spectrometer D1', type: 'npk', field: 'Sector Delta', value: 45, unit: 'ppm', status: 'normal', icon: '🌱', history: [40, 42, 43, 44, 45, 45] },
  { id: 6, name: 'Subsurface Moisture Probe E1', type: 'moisture', field: 'Sector Epsilon', value: 28, unit: '%', status: 'danger', icon: '💧', history: [55, 48, 42, 38, 33, 28] },
  { id: 7, name: 'PAR Solar Radiation Gauge A3', type: 'light', field: 'Sector Alpha', value: 850, unit: 'lux', status: 'normal', icon: '☀️', history: [800, 820, 840, 850, 845, 850] },
  { id: 8, name: 'Anemometer Wind Vector B3', type: 'wind', field: 'Sector Beta', value: 12, unit: 'km/h', status: 'normal', icon: '💨', history: [8, 10, 11, 14, 13, 12] },
];

const STATUS_COLORS = {
  normal: TACTICAL_THEME.radar,
  warning: TACTICAL_THEME.telemetry,
  danger: TACTICAL_THEME.alert,
};

const FILTER_TYPES = ['all', 'temperature', 'moisture', 'ph', 'npk', 'light', 'wind'];

export default function SensorsPage() {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSensor, setSelectedSensor] = useState(null);

  const filtered = MOCK_SENSORS.filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const MiniChart = ({ history, color }) => {
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;
    const h = 36;
    const w = 120;
    const points = history.map((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
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
          padding: '18px',
          borderRadius: 8,
          backgroundColor: TACTICAL_THEME.bgPanel,
          border: `1px solid ${isSelected ? TACTICAL_THEME.radar : TACTICAL_THEME.border}`,
          boxShadow: isSelected ? TACTICAL_THEME.shadowGlow : TACTICAL_THEME.shadowPanel,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: '1 1 280px',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.borderColor = 'rgba(0, 245, 160, 0.4)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.borderColor = TACTICAL_THEME.border;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{sensor.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: TACTICAL_THEME.textPrimary }}>{sensor.name}</div>
              <div style={{ fontSize: 10, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>{sensor.field}</div>
            </div>
          </div>
          <span style={{
            fontSize: 8.5,
            fontWeight: 800,
            color: statusColor,
            fontFamily: TACTICAL_THEME.fontMono,
            backgroundColor: `${statusColor}15`,
            padding: '2px 6px',
            borderRadius: 3,
            border: `1px solid ${statusColor}40`,
          }}>
            {sensor.status.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>CURRENT TELEMETRY</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: statusColor, fontFamily: TACTICAL_THEME.fontMono, lineHeight: 1.1 }}>
              {sensor.value} <span style={{ fontSize: 13, color: TACTICAL_THEME.textSecondary }}>{sensor.unit}</span>
            </div>
          </div>
          <MiniChart history={sensor.history} color={statusColor} />
        </div>
      </div>
    );
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }} data-testid="sensors-page">
      {/* Header & Filter HUD */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 16,
        borderBottom: `1px solid ${TACTICAL_THEME.border}`,
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_TYPES.map((t) => {
            const isActive = filterType === t;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: isActive ? `1px solid ${TACTICAL_THEME.satellite}` : `1px solid ${TACTICAL_THEME.border}`,
                  backgroundColor: isActive ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? TACTICAL_THEME.satellite : TACTICAL_THEME.textSecondary,
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontFamily: TACTICAL_THEME.fontMono,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'normal', 'warning', 'danger'].map((s) => {
            const isActive = filterStatus === s;
            const color = s === 'danger' ? TACTICAL_THEME.alert : s === 'warning' ? TACTICAL_THEME.telemetry : s === 'normal' ? TACTICAL_THEME.radar : TACTICAL_THEME.textPrimary;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: isActive ? `1px solid ${color}` : `1px solid ${TACTICAL_THEME.border}`,
                  backgroundColor: isActive ? `${color}15` : 'transparent',
                  color: isActive ? color : TACTICAL_THEME.textSecondary,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: TACTICAL_THEME.fontMono,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Sensors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {filtered.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  );
}
