/**
 * SettingsPage — Tactical System Configuration & Operator Profile
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Operator credentials, telemetry alert subscriptions, and system preferences.
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [notifications, setNotifications] = useState({
    diseaseAlerts: true,
    sensorAlerts: true,
    irrigationReminders: true,
    weeklyReports: false,
    recommendations: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY',
    units: 'metric',
  });

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingSection = ({ title, icon, children }) => (
    <div style={{
      borderRadius: 8,
      backgroundColor: TACTICAL_THEME.bgPanel,
      border: `1px solid ${TACTICAL_THEME.border}`,
      boxShadow: TACTICAL_THEME.shadowPanel,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${TACTICAL_THEME.border}`,
        fontSize: 12,
        fontWeight: 800,
        color: TACTICAL_THEME.textPrimary,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: TACTICAL_THEME.fontMono,
        backgroundColor: 'rgba(6, 9, 14, 0.4)',
      }}>
        <span>{icon}</span> {title}
      </div>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: TACTICAL_THEME.textPrimary }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: TACTICAL_THEME.textMuted, marginTop: 2, fontFamily: TACTICAL_THEME.fontFamily }}>{description}</div>}
      </div>
      {children}
    </div>
  );

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <div
      onClick={onToggle}
      style={{
        width: 38,
        height: 20,
        borderRadius: 10,
        position: 'relative',
        backgroundColor: isOn ? TACTICAL_THEME.radar : 'rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        padding: 2,
      }}
    >
      <div style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#06090E',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        transform: `translateX(${isOn ? 18 : 0}px)`,
        transition: 'transform 0.2s',
      }} />
    </div>
  );

  const SelectInput = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '6px 12px',
        borderRadius: 4,
        border: `1px solid ${TACTICAL_THEME.border}`,
        backgroundColor: TACTICAL_THEME.bgInput,
        color: TACTICAL_THEME.textPrimary,
        fontSize: 11.5,
        fontWeight: 600,
        fontFamily: TACTICAL_THEME.fontMono,
        outline: 'none',
        minWidth: 160,
        cursor: 'pointer',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ backgroundColor: TACTICAL_THEME.bgPanelSolid, color: TACTICAL_THEME.textPrimary }}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: 820,
    }} data-testid="settings-page">
      {/* Operator Credentials Dossier Header */}
      <div style={{
        padding: '20px 24px',
        borderRadius: 8,
        backgroundColor: TACTICAL_THEME.bgPanel,
        border: `1px solid ${TACTICAL_THEME.border}`,
        boxShadow: TACTICAL_THEME.shadowPanel,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          backgroundColor: 'rgba(0, 245, 160, 0.12)',
          border: `1px solid ${TACTICAL_THEME.radar}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 900,
          color: TACTICAL_THEME.radar,
          fontFamily: TACTICAL_THEME.fontMono,
        }}>
          {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TACTICAL_THEME.textPrimary }}>
            {user?.fullName || 'Field Commander'}
          </div>
          <div style={{ fontSize: 12, color: TACTICAL_THEME.satellite, fontFamily: TACTICAL_THEME.fontMono, marginTop: 2 }}>
            OPERATOR ID: {user?.email || 'admin@cropvision.ai'}
          </div>
          <div style={{ fontSize: 10, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono, marginTop: 4 }}>
            CLEARANCE: LEVEL 4 (FULL TELEMETRY DISPATCH)
          </div>
        </div>
      </div>

      {/* Telemetry Alert Subscriptions */}
      <SettingSection title="TELEMETRY ALERT SUBSCRIPTIONS" icon="🔔">
        {[
          { key: 'diseaseAlerts', label: 'Pathogen Outbreak Alerts', description: 'Real-time push notifications upon AI optical pathogen detection' },
          { key: 'sensorAlerts', label: 'Sensor Threshold Breaches', description: 'Triggered when canopy heat or soil moisture exits nominal vector' },
          { key: 'irrigationReminders', label: 'Precision Irrigation Schedules', description: 'Automated notification before scheduled valve dispatches' },
          { key: 'weeklyReports', label: 'Weekly Cadastre Digest', description: 'Compiled weekly field dossier delivered via system log' },
          { key: 'recommendations', label: 'AI Prescriptive Advisories', description: 'Advisory triggers for chemical/biological countermeasures' },
        ].map((item) => (
          <SettingRow key={item.key} label={item.label} description={item.description}>
            <ToggleSwitch isOn={notifications[item.key]} onToggle={() => toggleNotification(item.key)} />
          </SettingRow>
        ))}
      </SettingSection>

      {/* Regional & Telemetry Preferences */}
      <SettingSection title="REGIONAL & SENSOR PREFERENCES" icon="⚙️">
        <SettingRow label="Language Interface" description="Primary operational command language">
          <SelectInput value={preferences.language} onChange={(v) => setPreferences((p) => ({ ...p, language: v }))} options={[
            { value: 'vi', label: '🇻🇳 Tiếng Việt (Default)' },
            { value: 'en', label: '🇺🇸 English' },
          ]} />
        </SettingRow>
        <SettingRow label="Telemetry Timezone" description="Reference clock for UTC timestamp logging">
          <SelectInput value={preferences.timezone} onChange={(v) => setPreferences((p) => ({ ...p, timezone: v }))} options={[
            { value: 'Asia/Ho_Chi_Minh', label: '🇻🇳 Asia/Ho Chi Minh (UTC+7)' },
            { value: 'UTC', label: '🌍 UTC Standard' },
          ]} />
        </SettingRow>
        <SettingRow label="Measurement Standard" description="Metric or imperial units for temperature, area, volume">
          <SelectInput value={preferences.units} onChange={(v) => setPreferences((p) => ({ ...p, units: v }))} options={[
            { value: 'metric', label: '📏 Metric (°C, ha, mm, kg)' },
            { value: 'imperial', label: '📐 Imperial (°F, ac, in, lb)' },
          ]} />
        </SettingRow>
      </SettingSection>

      {/* Operator Session Controls */}
      <SettingSection title="OPERATOR SESSION CONTROLS" icon="👤">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: `1px solid ${TACTICAL_THEME.border}`,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            color: TACTICAL_THEME.textSecondary,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: TACTICAL_THEME.fontMono,
          }}>
            ✏️ EDIT CREDENTIALS
          </button>
          <button
            onClick={async () => {
              await logout();
              window.location.href = '/welcome';
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: `1px solid rgba(255, 46, 84, 0.3)`,
              backgroundColor: 'rgba(255, 46, 84, 0.08)',
              color: TACTICAL_THEME.alert,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: TACTICAL_THEME.fontMono,
            }}
          >
            ⏻ TERMINATE SESSION
          </button>
        </div>
      </SettingSection>
    </div>
  );
}
