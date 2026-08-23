/**
 * RecommendationsPage — Tactical Agronomy AI Recommendations
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Machine intelligence prescriptive advisories with operator authorization workflow.
 */

import React, { useState } from 'react';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

const MOCK_RECOMMENDATIONS = [
  { id: 1, title: 'Deploy Antifungal Countermeasure - Zone A3', priority: 'high', category: 'disease', field: 'Sector Alpha', zone: 'Zone A3', description: 'Leaf blight detected with 87% confidence. Immediate fungicide application recommended to prevent spread to adjacent zones.', reasoning: 'Historical data shows 3x spread rate without treatment within 48h. Current weather conditions (high humidity, 32°C) favor fungal growth.', status: 'pending', created: '2h ago', icon: '🦠' },
  { id: 2, title: 'Increase Subsurface Irrigation Rate - Sector Epsilon', priority: 'high', category: 'irrigation', field: 'Sector Epsilon', zone: 'Zone E1', description: 'Soil moisture dropped to 28%, well below the 45% threshold for cashew cultivation. Root stress indicators detected.', reasoning: 'Weather forecast shows no rain for 5 days. Current irrigation schedule insufficient for evapotranspiration rate.', status: 'pending', created: '3h ago', icon: '💧' },
  { id: 3, title: 'Rhizosphere Calcium Liming - Sector Gamma', priority: 'medium', category: 'soil', field: 'Sector Gamma', zone: 'Zone C1', description: 'pH level at 5.2 is below optimal range (5.5-6.5) for pepper. Calcium carbonate application recommended.', reasoning: 'Low pH reduces nutrient availability by up to 40%. Last lime application was 6 months ago.', status: 'pending', created: '1d ago', icon: '🧪' },
  { id: 4, title: 'Harvest Logistics Window - Sector Delta', priority: 'low', category: 'harvest', field: 'Sector Delta', zone: 'Zone D1', description: 'Durian fruit maturity indicators suggest optimal harvest window in 3-5 days. Weather conditions are favorable.', reasoning: 'Sugar content readings approaching 32 Brix. No adverse weather expected. Labor availability confirmed.', status: 'approved', created: '2d ago', icon: '🍈' },
  { id: 5, title: 'Pheromone Trap Array Enhancement - Sector Beta', priority: 'medium', category: 'pest', field: 'Sector Beta', zone: 'Zone B2', description: 'Increased insect activity detected on sensors. Preventive neem oil spray recommended before population reaches threshold.', reasoning: 'Light trap data shows 2x normal moth count. Coffee berry borer season typically peaks in 2 weeks.', status: 'pending', created: '3d ago', icon: '🐛' },
];

const PRIORITY_COLORS = {
  high: TACTICAL_THEME.alert,
  medium: TACTICAL_THEME.telemetry,
  low: TACTICAL_THEME.radar,
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState(MOCK_RECOMMENDATIONS);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const handleAction = (id, action) => {
    setRecommendations((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
  };

  const filtered = recommendations.filter((r) => {
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }} data-testid="recommendations-page">
      {/* Telemetry Metric Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL ADVISORIES', value: recommendations.length, icon: '💡', color: TACTICAL_THEME.satellite },
          { label: 'AWAITING AUTHORIZATION', value: recommendations.filter((r) => r.status === 'pending').length, icon: '⏳', color: TACTICAL_THEME.telemetry },
          { label: 'HIGH THREAT PRIORITY', value: recommendations.filter((r) => r.priority === 'high' && r.status === 'pending').length, icon: '🔴', color: TACTICAL_THEME.alert },
          { label: 'AUTHORIZED / DISPATCHED', value: recommendations.filter((r) => r.status === 'approved').length, icon: '✅', color: TACTICAL_THEME.radar },
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

      {/* Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'high', 'medium', 'low'].map((p) => {
            const isActive = filterPriority === p;
            const color = PRIORITY_COLORS[p] || TACTICAL_THEME.textPrimary;
            return (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${isActive ? color : TACTICAL_THEME.border}`,
                  backgroundColor: isActive ? `${color}15` : 'transparent',
                  color: isActive ? color : TACTICAL_THEME.textSecondary,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: TACTICAL_THEME.fontMono,
                }}
              >
                {p} PRIORITY
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'pending', 'approved', 'dismissed'].map((s) => {
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${isActive ? TACTICAL_THEME.radar : TACTICAL_THEME.border}`,
                  backgroundColor: isActive ? 'rgba(0, 245, 160, 0.12)' : 'transparent',
                  color: isActive ? TACTICAL_THEME.radar : TACTICAL_THEME.textSecondary,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: TACTICAL_THEME.fontMono,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendations Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const priorityColor = PRIORITY_COLORS[rec.priority];

          return (
            <div
              key={rec.id}
              style={{
                borderRadius: 8,
                backgroundColor: TACTICAL_THEME.bgPanel,
                border: `1px solid ${TACTICAL_THEME.border}`,
                boxShadow: TACTICAL_THEME.shadowPanel,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 24, marginTop: 2 }}>{rec.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: TACTICAL_THEME.textPrimary }}>{rec.title}</span>
                      <span style={{
                        fontSize: 8.5,
                        fontWeight: 800,
                        color: priorityColor,
                        fontFamily: TACTICAL_THEME.fontMono,
                        backgroundColor: `${priorityColor}15`,
                        padding: '2px 6px',
                        borderRadius: 3,
                        border: `1px solid ${priorityColor}30`,
                      }}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono, marginTop: 4 }}>
                      LOC: {rec.field} — {rec.zone} · GENERATED: {rec.created}
                    </div>
                    <div style={{ fontSize: 12, color: TACTICAL_THEME.textSecondary, marginTop: 8, lineHeight: 1.5 }}>
                      {rec.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {rec.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(rec.id, 'approved')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(0, 245, 160, 0.15)',
                          border: `1px solid ${TACTICAL_THEME.radar}`,
                          color: TACTICAL_THEME.radar,
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: TACTICAL_THEME.fontMono,
                        }}
                      >
                        ✓ AUTHORIZE
                      </button>
                      <button
                        onClick={() => handleAction(rec.id, 'dismissed')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(255, 46, 84, 0.1)',
                          border: `1px solid rgba(255, 46, 84, 0.3)`,
                          color: TACTICAL_THEME.alert,
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: TACTICAL_THEME.fontMono,
                        }}
                      >
                        ✕ DISMISS
                      </button>
                    </>
                  )}
                  {rec.status !== 'pending' && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: rec.status === 'approved' ? TACTICAL_THEME.radar : TACTICAL_THEME.textMuted,
                      fontFamily: TACTICAL_THEME.fontMono,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 8px',
                      borderRadius: 4,
                    }}>
                      [{rec.status.toUpperCase()}]
                    </span>
                  )}
                </div>
              </div>

              {/* Rationale accordian */}
              <div style={{
                padding: '10px 14px',
                borderRadius: 6,
                backgroundColor: 'rgba(6, 9, 14, 0.4)',
                border: `1px solid ${TACTICAL_THEME.borderSubtle}`,
                fontSize: 11,
                color: TACTICAL_THEME.textSecondary,
                lineHeight: 1.4,
              }}>
                <span style={{ color: TACTICAL_THEME.satellite, fontWeight: 800, fontFamily: TACTICAL_THEME.fontMono }}>AI RATIONALE: </span>
                {rec.reasoning}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
