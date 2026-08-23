/**
 * InterventionsPage — Tactical Intervention & Treatment Log
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Agronomic countermeasures and chemical/biological intervention registry.
 */

import React, { useState } from 'react';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

const MOCK_INTERVENTIONS = [
  { id: 1, title: 'Targeted Fungicide Spray - Zone A3', type: 'treatment', field: 'Sector Alpha', status: 'completed', priority: 'high', assignedTo: 'Nguyen Van A', scheduledDate: '2026-05-30', completedDate: '2026-05-30', notes: 'Applied Mancozeb 75WP at 2.5g/L. Covered 2.3ha of affected blast cluster.', cost: '$180', icon: '🧪' },
  { id: 2, title: 'Precision Irrigation Protocol - Sector E', type: 'irrigation', field: 'Sector Epsilon', status: 'in_progress', priority: 'high', assignedTo: 'Tran Thi B', scheduledDate: '2026-05-31', completedDate: null, notes: 'Subsurface drip rate increased +30% to counter heat index.', cost: '$45', icon: '💧' },
  { id: 3, title: 'Rhizosphere Liming Amendment - Sector Gamma', type: 'soil_amendment', field: 'Sector Gamma', status: 'scheduled', priority: 'medium', assignedTo: 'Le Van C', scheduledDate: '2026-06-02', completedDate: null, notes: 'Agricultural lime at 2 tons/ha to neutralize acidic soil.', cost: '$320', icon: '🌱' },
  { id: 4, title: 'Pheromone Trap Array Deployment - Sector Beta', type: 'monitoring', field: 'Sector Beta', status: 'completed', priority: 'medium', assignedTo: 'Nguyen Van A', scheduledDate: '2026-05-28', completedDate: '2026-05-28', notes: 'Installed 12 traps across Zone B2. Baseline: 15 moths/trap.', cost: '$95', icon: '🐛' },
  { id: 5, title: 'Foliar Micronutrient Application - Sector Delta', type: 'fertilization', field: 'Sector Delta', status: 'completed', priority: 'low', assignedTo: 'Pham Thi D', scheduledDate: '2026-05-25', completedDate: '2026-05-25', notes: 'NPK (20-20-20) + Zinc chelate applied at dusk.', cost: '$120', icon: '🌿' },
  { id: 6, title: 'Harvest Vector Mobilization - Sector Delta', type: 'harvest', field: 'Sector Delta', status: 'scheduled', priority: 'low', assignedTo: 'Team Alpha', scheduledDate: '2026-06-03', completedDate: null, notes: 'Estimated yield: 8.4 tons paddy grain.', cost: '$450', icon: '🍈' },
];

const STATUS_COLORS = {
  scheduled: TACTICAL_THEME.satellite,
  in_progress: TACTICAL_THEME.telemetry,
  completed: TACTICAL_THEME.radar,
  cancelled: TACTICAL_THEME.alert,
};

export default function InterventionsPage() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filtered = MOCK_INTERVENTIONS.filter((i) => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterType !== 'all' && i.type !== filterType) return false;
    return true;
  });

  const totalCost = MOCK_INTERVENTIONS.reduce((sum, i) => sum + parseInt(i.cost.replace('$', '')), 0);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }} data-testid="interventions-page">
      {/* Summary KPI Row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL DISPATCHES', value: MOCK_INTERVENTIONS.length, icon: '🔧', color: TACTICAL_THEME.satellite },
          { label: 'EXECUTED / RESOLVED', value: MOCK_INTERVENTIONS.filter((i) => i.status === 'completed').length, icon: '✅', color: TACTICAL_THEME.radar },
          { label: 'IN OPERATION', value: MOCK_INTERVENTIONS.filter((i) => i.status === 'in_progress').length, icon: '⏳', color: TACTICAL_THEME.telemetry },
          { label: 'TOTAL EXPENDITURE', value: `$${totalCost}`, icon: '💰', color: TACTICAL_THEME.textPrimary },
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

      {/* Filters & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'scheduled', 'in_progress', 'completed'].map((s) => {
            const isActive = filterStatus === s;
            const color = STATUS_COLORS[s] || TACTICAL_THEME.textPrimary;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
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
                {s.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        <button
          style={{
            padding: '8px 16px',
            borderRadius: 5,
            border: `1px solid ${TACTICAL_THEME.radar}`,
            backgroundColor: 'rgba(0, 245, 160, 0.12)',
            color: TACTICAL_THEME.radar,
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: TACTICAL_THEME.fontMono,
          }}
        >
          + DISPATCH INTERVENTION
        </button>
      </div>

      {/* Intervention Log Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((item) => {
          const statusColor = STATUS_COLORS[item.status] || TACTICAL_THEME.textSecondary;
          return (
            <div
              key={item.id}
              style={{
                padding: '16px 20px',
                borderRadius: 8,
                backgroundColor: TACTICAL_THEME.bgPanel,
                border: `1px solid ${TACTICAL_THEME.border}`,
                boxShadow: TACTICAL_THEME.shadowPanel,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 24, marginTop: 2 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: TACTICAL_THEME.textPrimary }}>{item.title}</span>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      color: statusColor,
                      fontFamily: TACTICAL_THEME.fontMono,
                      backgroundColor: `${statusColor}15`,
                      padding: '1px 5px',
                      borderRadius: 3,
                      border: `1px solid ${statusColor}30`,
                    }}>
                      {item.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: TACTICAL_THEME.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
                    {item.notes}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: TACTICAL_THEME.textMuted, fontFamily: TACTICAL_THEME.fontMono }}>
                    <span>LOC: {item.field}</span>
                    <span>•</span>
                    <span>OP: {item.assignedTo}</span>
                    <span>•</span>
                    <span>DATE: {item.scheduledDate}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: TACTICAL_THEME.satellite, fontFamily: TACTICAL_THEME.fontMono }}>
                {item.cost}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
