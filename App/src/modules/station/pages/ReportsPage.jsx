/**
 * ReportsPage — SoilzePro Reports & Export
 *
 * Wireframe: soilzepro-research/markdown-wireframes.md (Report)
 * Data export, analysis reports, and report generation
 */

import { useState } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';
import { SHADOWS } from '../../@core/constants/theme';

const MOCK_REPORTS = [
  { id: 1, title: 'Weekly Field Health Summary', type: 'field_health', date: '2026-05-30', status: 'ready', size: '2.4 MB', format: 'PDF', icon: '📊' },
  { id: 2, title: 'Disease Detection Analytics - May 2026', type: 'disease', date: '2026-05-29', status: 'ready', size: '5.1 MB', format: 'PDF', icon: '🦠' },
  { id: 3, title: 'IoT Sensor Data Export', type: 'sensor_data', date: '2026-05-28', status: 'ready', size: '12.3 MB', format: 'CSV', icon: '📡' },
  { id: 4, title: 'Soil Microbiome Analysis Report', type: 'microbiome', date: '2026-05-27', status: 'ready', size: '3.8 MB', format: 'PDF', icon: '🔬' },
  { id: 5, title: 'Intervention Cost Analysis - Q2', type: 'cost', date: '2026-05-26', status: 'generating', size: '—', format: 'PDF', icon: '💰' },
  { id: 6, title: 'Crop Yield Forecast', type: 'forecast', date: '2026-05-25', status: 'ready', size: '1.9 MB', format: 'PDF', icon: '🌾' },
];

const REPORT_TEMPLATES = [
  { title: 'Field Health Report', description: 'Comprehensive field health analysis with sensor data and disease detection results', icon: '📊', color: '#38bdf8' },
  { title: 'Sensor Data Export', description: 'Raw time-series data from all IoT sensors in CSV or JSON format', icon: '📡', color: '#4ade80' },
  { title: 'Disease Analytics', description: 'AI detection results, confidence scores, and disease frequency analysis', icon: '🦠', color: '#ef4444' },
  { title: 'Soil Analysis Report', description: 'Microbiome composition, NPK levels, pH trends, and diversity indices', icon: '🔬', color: '#a78bfa' },
  { title: 'Intervention Summary', description: 'Action log, costs, outcomes, and ROI analysis for all interventions', icon: '🔧', color: '#f59e0b' },
  { title: 'Executive Dashboard', description: 'High-level KPIs, trends, and strategic recommendations for stakeholders', icon: '📋', color: '#2C5E43' },
];

export default function ReportsPage() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('library');

  const STATUS_COLORS = {
    ready: colors.success,
    generating: colors.warning,
    failed: colors.danger,
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="reports-page">
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 }}>
        {[
          { key: 'library', label: '📄 Report Library', count: MOCK_REPORTS.length },
          { key: 'generate', label: '➕ Generate Report' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 16px', borderRadius: 8,
            border: `1px solid ${activeTab === tab.key ? colors.primary : 'transparent'}`,
            backgroundColor: activeTab === tab.key ? `${colors.primary}20` : 'transparent',
            color: activeTab === tab.key ? colors.primaryGlow : colors.textSecondary,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
          }}>
            {tab.label} {tab.count !== undefined && <span style={{ marginLeft: 6, fontSize: 10, color: colors.textMuted }}>({tab.count})</span>}
          </button>
        ))}
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Report Summary */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Reports', value: MOCK_REPORTS.length, icon: '📄', color: colors.info },
              { label: 'Ready', value: MOCK_REPORTS.filter(r => r.status === 'ready').length, icon: '✅', color: colors.success },
              { label: 'Generating', value: MOCK_REPORTS.filter(r => r.status === 'generating').length, icon: '⏳', color: colors.warning },
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

          {/* Reports Table */}
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: SHADOWS.card,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", "Outfit", system-ui, sans-serif' }}>
              <thead>
                <tr style={{ backgroundColor: colors.surfaceHover }}>
                  {['Report', 'Type', 'Date', 'Format', 'Size', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_REPORTS.map(report => (
                  <tr key={report.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                      <span style={{ marginRight: 8 }}>{report.icon}</span>{report.title}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' }}>{report.type.replace('_', ' ')}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: colors.textMuted }}>{report.date}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, backgroundColor: `${colors.info}20`, color: colors.info }}>{report.format}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: colors.textMuted }}>{report.size}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, backgroundColor: `${STATUS_COLORS[report.status]}20`, color: STATUS_COLORS[report.status], textTransform: 'capitalize' }}>{report.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {report.status === 'ready' && (
                        <button style={{
                          padding: '5px 12px', borderRadius: 6, border: `1px solid ${colors.border}`,
                          backgroundColor: 'transparent', color: colors.textSecondary, fontSize: 11,
                          fontWeight: 600, cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
                        }}>⬇️ Download</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Generate Report Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {REPORT_TEMPLATES.map((template, i) => (
            <div key={i} style={{
              padding: '20px', borderRadius: 12,
              backgroundColor: colors.surface, border: `1px solid ${colors.border}`,
              boxShadow: SHADOWS.card, cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = template.color; e.currentTarget.style.boxShadow = `0 0 16px ${template.color}30`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = SHADOWS.card; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  backgroundColor: `${template.color}15`, border: `1px solid ${template.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>{template.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{template.title}</div>
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>{template.description}</div>
              <button style={{
                padding: '10px', borderRadius: 8, border: 'none',
                backgroundColor: template.color, color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
                marginTop: 'auto',
              }}>Generate Report</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}