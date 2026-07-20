/**
 * SettingsPage — SoilzePro Settings & Profile
 *
 * Wireframe: soilzepro-research/markdown-wireframes.md (User Profile & Settings)
 * Account management, theme toggle, notification preferences
 */

import { useState } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { SHADOWS } from '../../@core/constants/theme';

export default function SettingsPage() {
  const { colors, isDark, toggleTheme } = useTheme();
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
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingSection = ({ title, icon, children }) => (
    <div style={{
      borderRadius: 12, backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`, boxShadow: SHADOWS.card,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: `1px solid ${colors.border}`,
        fontSize: 14, fontWeight: 700, color: colors.textPrimary,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{icon}</span> {title}
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{description}</div>}
      </div>
      {children}
    </div>
  );

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <div onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11, position: 'relative',
      backgroundColor: isOn ? colors.primary : colors.border,
      cursor: 'pointer', transition: 'background-color 0.2s',
      display: 'flex', alignItems: 'center', padding: 2,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transform: `translateX(${isOn ? 18 : 0}px)`,
        transition: 'transform 0.2s',
      }} />
    </div>
  );

  const SelectInput = ({ value, onChange, options }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      padding: '8px 12px', borderRadius: 8,
      border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceHover,
      color: colors.textPrimary, fontSize: 12, fontWeight: 500,
      fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
      outline: 'none', minWidth: 160, cursor: 'pointer',
    }}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }} data-testid="settings-page">
      {/* Profile Header */}
      <div style={{
        padding: '24px', borderRadius: 12,
        background: colors.gradientPrimary, boxShadow: SHADOWS.card,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#fff',
        }}>
          {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{user?.fullName || 'Admin User'}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{user?.email || 'admin@cropvision.com'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Administrator · Member since 2025</div>
        </div>
      </div>

      {/* Appearance */}
      <SettingSection title="Appearance" icon="🎨">
        <SettingRow label="Theme Mode" description="Switch between dark and light appearance">
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'dark', label: '🌙 Dark' },
              { key: 'light', label: '☀️ Light' },
            ].map(theme => {
              const isActive = (theme.key === 'dark') === isDark;
              return (
                <button key={theme.key} onClick={() => { if (!isActive) toggleTheme(); }} style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px solid ${isActive ? colors.primary : colors.border}`,
                  backgroundColor: isActive ? `${colors.primary}20` : 'transparent',
                  color: isActive ? colors.primaryGlow : colors.textSecondary,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
                }}>
                  {theme.label}
                </button>
              );
            })}
          </div>
        </SettingRow>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notifications" icon="🔔">
        {[
          { key: 'diseaseAlerts', label: 'Disease Detection Alerts', description: 'Get notified when AI detects disease in your fields' },
          { key: 'sensorAlerts', label: 'Sensor Threshold Alerts', description: 'Alerts when sensor readings exceed normal ranges' },
          { key: 'irrigationReminders', label: 'Irrigation Reminders', description: 'Scheduled irrigation notifications' },
          { key: 'weeklyReports', label: 'Weekly Report Digest', description: 'Receive a summary report every Monday' },
          { key: 'recommendations', label: 'AI Recommendations', description: 'New recommendation notifications' },
        ].map(item => (
          <SettingRow key={item.key} label={item.label} description={item.description}>
            <ToggleSwitch isOn={notifications[item.key]} onToggle={() => toggleNotification(item.key)} />
          </SettingRow>
        ))}
      </SettingSection>

      {/* Preferences */}
      <SettingSection title="Preferences" icon="⚙️">
        <SettingRow label="Language" description="Application display language">
          <SelectInput value={preferences.language} onChange={(v) => setPreferences(p => ({ ...p, language: v }))} options={[
            { value: 'vi', label: '🇻🇳 Tiếng Việt' },
            { value: 'en', label: '🇺🇸 English' },
          ]} />
        </SettingRow>
        <SettingRow label="Timezone" description="Your local timezone">
          <SelectInput value={preferences.timezone} onChange={(v) => setPreferences(p => ({ ...p, timezone: v }))} options={[
            { value: 'Asia/Ho_Chi_Minh', label: '🇻🇳 Asia/Ho Chi Minh' },
            { value: 'UTC', label: '🌍 UTC' },
          ]} />
        </SettingRow>
        <SettingRow label="Units" description="Measurement system">
          <SelectInput value={preferences.units} onChange={(v) => setPreferences(p => ({ ...p, units: v }))} options={[
            { value: 'metric', label: '📏 Metric (°C, mm, kg)' },
            { value: 'imperial', label: '📐 Imperial (°F, in, lb)' },
          ]} />
        </SettingRow>
      </SettingSection>

      {/* Account Actions */}
      <SettingSection title="Account" icon="👤">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{
            padding: '10px 20px', borderRadius: 8,
            border: `1px solid ${colors.border}`, backgroundColor: 'transparent',
            color: colors.textSecondary, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
          }}>✏️ Edit Profile</button>
          <button style={{
            padding: '10px 20px', borderRadius: 8,
            border: `1px solid ${colors.border}`, backgroundColor: 'transparent',
            color: colors.textSecondary, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
          }}>🔑 Change Password</button>
          <button onClick={async () => { await logout(); window.location.href = '/welcome'; }} style={{
            padding: '10px 20px', borderRadius: 8,
            border: `1px solid ${colors.danger}30`, backgroundColor: `${colors.danger}10`,
            color: colors.danger, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
          }}>🚪 Logout</button>
        </div>
      </SettingSection>
    </div>
  );
}