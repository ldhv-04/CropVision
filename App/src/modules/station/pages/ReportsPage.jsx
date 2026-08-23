/**
 * ReportsPage — Tactical Agronomy Intelligence & Dossier Export
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Exportable threat analysis, agronomic reports, and raw GIS CSV telemetry streams.
 */

import React, { useState } from 'react';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

const MOCK_REPORTS = [
  { id: 1, title: 'Weekly Field Health & Threat Summary', type: 'field_health', date: '2026-05-30', status: 'ready', size: '2.4 MB', format: 'PDF', icon: '📊' },
  { id: 2, title: 'Disease Epidemic Analytics - May 2026', type: 'disease', date: '2026-05-29', status: 'ready', size: '5.1 MB', format: 'PDF', icon: '🦠' },
  { id: 3, title: 'IoT Telemetry Vector Stream Export', type: 'sensor_data', date: '2026-05-28', status: 'ready', size: '12.3 MB', format: 'CSV', icon: '📡' },
  { id: 4, title: 'Rhizosphere Microbiome & NPK Profile', type: 'microbiome', date: '2026-05-27', status: 'ready', size: '3.8 MB', format: 'PDF', icon: '🔬' },
  { id: 5, title: 'Intervention Cost & Agronomic ROI - Q2', type: 'cost', date: '2026-05-26', status: 'generating', size: '—', format: 'PDF', icon: '💰' },
  { id: 6, title: 'Sector Yield Estimation & Biomass Projection', type: 'forecast', date: '2026-05-25', status: 'ready', size: '1.9 MB', format: 'PDF', icon: '🌾' },
];

const REPORT_TEMPLATES = [
  { title: 'Sector Health Dossier', description: 'Comprehensive field health analysis with sensor data and disease detection results', icon: '📊', color: TACTICAL_THEME.satellite },
  { title: 'Sensor Stream Telemetry', description: 'Raw time-series data from all IoT sensors in CSV or JSON format', icon: '📡', color: TACTICAL_THEME.radar },
  { title: 'Pathogen Spectrum Analysis', description: 'AI detection results, confidence scores, and disease frequency analysis', icon: '🦠', color: TACTICAL_THEME.alert },
  { title: 'Soil Microbiome Audit', description: 'Microbiome composition, NPK levels, pH trends, and diversity indices', icon: '🔬', color: TACTICAL_THEME.violet },
  { title: 'Countermeasure Log', description: 'Action log, costs, outcomes, and ROI analysis for all interventions', icon: '🔧', color: TACTICAL_THEME.telemetry },
  { title: 'Mission Command Briefing', description: 'High-level KPIs, trends, and strategic recommendations for farm managers', icon: '📋', color: '#38BDF8' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('library');

  const STATUS_COLORS = {
    ready: TACTICAL_THEME.radar,
    generating: TACTICAL_THEME.telemetry,
    failed: TACTICAL_THEME.alert,
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }} data-testid="reports-page">
      {/* Tactical Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 6,
        borderBottom: `1px solid ${TACTICAL_THEME.border}`,
        paddingBottom: 12,
      }}>
        {[
          { key: 'library', label: '📄 DOSSIER LIBRARY', count: MOCK_REPORTS.length },
          { key: 'generate', label: '⚡ GENERATE INTEL REPORT' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: `1px solid ${isActive ? TACTICAL_THEME.radar : TACTICAL_THEME.border}`,
                backgroundColor: isActive ? 'rgba(0, 245, 160, 0.12)' : 'transparent',
                color: isActive ? TACTICAL_THEME.radar : TACTICAL_THEME.textSecondary,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: TACTICAL_THEME.fontMono,
              }}
            >
              {tab.label} {tab.count !== undefined && <span style={{ marginLeft: 6, fontSize: 9.5, color: TACTICAL_THEME.satellite }}>[{tab.count}]</span>}
            </button>
          );
        })}
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Summary Row */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'ARCHIVED DOSSIERS', value: MOCK_REPORTS.length, icon: '📄', color: TACTICAL_THEME.satellite },
              { label: 'COMPILED & READY', value: MOCK_REPORTS.filter((r) => r.status === 'ready').length, icon: '✅', color: TACTICAL_THEME.radar },
              { label: 'COMPILING VECTOR', value: MOCK_REPORTS.filter((r) => r.status === 'generating').length, icon: '⏳', color: TACTICAL_THEME.telemetry },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: '1 1 180px',
                padding: '16px 18px',
                borderRadius: 8,
                backgroundColor: TACTICAL_THEME.bgPanel,
                border: `1px solid ${TACTICAL_THEME.border}`,
                boxShadow: TACTICAL_THEME.shadowPanel,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: 9, color: TACTICAL_THEME.textMuted, fontWeight: 800, fontFamily: TACTICAL_THEME.fontMono }}>{stat.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: stat.color, fontFamily: TACTICAL_THEME.fontMono, marginTop: 2 }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reports Table HUD */}
          <div style={{
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: TACTICAL_THEME.bgPanel,
            border: `1px solid ${TACTICAL_THEME.border}`,
            boxShadow: TACTICAL_THEME.shadowPanel,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: TACTICAL_THEME.fontFamily }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(6, 9, 14, 0.6)' }}>
                  {['DOSSIER TITLE', 'TYPE', 'DATE GENERATED', 'FORMAT', 'FILE SIZE', 'STATUS', 'DISPATCH'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 9,
                      fontWeight: 800,
                      color: TACTICAL_THEME.textMuted,
                      letterSpacing: '1px',
                      borderBottom: `1px solid ${TACTICAL_THEME.border}`,
                      fontFamily: TACTICAL_THEME.fontMono,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_REPORTS.map((report) => (
                  <tr key={report.id} style={{ borderBottom: `1px solid ${TACTICAL_THEME.borderSubtle}` }}>
                    <td style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 700, color: TACTICAL_THEME.textPrimary }}>
                      <span style={{ marginRight: 8 }}>{report.icon}</span>
                      {report.title}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: TACTICAL_THEME.textSecondary, fontFamily: TACTICAL_THEME.fontMono }}>
                      {report.type}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>
                      {report.date}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 10, fontFamily: TACTICAL_THEME.fontMono, color: TACTICAL_THEME.satellite, fontWeight: 800 }}>
                      [{report.format}]
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>
                      {report.size}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 8.5,
                        fontWeight: 800,
                        color: STATUS_COLORS[report.status],
                        backgroundColor: `${STATUS_COLORS[report.status]}15`,
                        padding: '2px 6px',
                        borderRadius: 3,
                        border: `1px solid ${STATUS_COLORS[report.status]}30`,
                        fontFamily: TACTICAL_THEME.fontMono,
                      }}>
                        {report.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: `1px solid ${TACTICAL_THEME.radar}`,
                          backgroundColor: 'rgba(0, 245, 160, 0.08)',
                          color: TACTICAL_THEME.radar,
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: TACTICAL_THEME.fontMono,
                        }}
                      >
                        ↓ EXPORT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Template Generator Grid */
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {REPORT_TEMPLATES.map((tmpl, i) => (
            <div key={i} style={{
              flex: '1 1 320px',
              padding: '20px',
              borderRadius: 8,
              backgroundColor: TACTICAL_THEME.bgPanel,
              border: `1px solid ${TACTICAL_THEME.border}`,
              boxShadow: TACTICAL_THEME.shadowPanel,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{tmpl.icon}</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TACTICAL_THEME.textPrimary }}>{tmpl.title}</div>
                </div>
                <div style={{ fontSize: 12, color: TACTICAL_THEME.textSecondary, lineHeight: 1.5 }}>
                  {tmpl.description}
                </div>
              </div>
              <button style={{
                padding: '8px 14px',
                borderRadius: 4,
                backgroundColor: 'rgba(0, 245, 160, 0.12)',
                border: `1px solid ${TACTICAL_THEME.radar}`,
                color: TACTICAL_THEME.radar,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: TACTICAL_THEME.fontMono,
              }}>
                ⚡ COMPILE DOSSIER
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
