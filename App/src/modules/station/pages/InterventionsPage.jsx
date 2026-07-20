/**
 * InterventionsPage — SoilzePro Intervention Log
 *
 * Wireframe: soilzepro-research/markdown-wireframes.md (Intervention)
 * Action log tracking all farm interventions with timeline view
 */

import { useState } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';
import { SHADOWS } from '../../@core/constants/theme';

const MOCK_INTERVENTIONS = [
  { id: 1, title: 'Fungicide Application - Zone A3', type: 'treatment', field: 'Field Alpha', status: 'completed', priority: 'high', assignedTo: 'Nguyen Van A', scheduledDate: '2026-05-30', completedDate: '2026-05-30', notes: 'Applied Mancozeb 75WP at 2.5g/L. Covered 2.3ha of affected area.', cost: '$180', icon: '🧪' },
  { id: 2, title: 'Irrigation Increase - Field Epsilon', type: 'irrigation', field: 'Field Epsilon', status: 'in_progress', priority: 'high', assignedTo: 'Tran Thi B', scheduledDate: '2026-05-31', completedDate: null, notes: 'Adjusted sprinkler system to increase output by 30%. Monitoring soil moisture hourly.', cost: '$45', icon: '💧' },
  { id: 3, title: 'Soil Liming - Field Gamma', type: 'soil_amendment', field: 'Field Gamma', status: 'scheduled', priority: 'medium', assignedTo: 'Le Van C', scheduledDate: '2026-06-02', completedDate: null, notes: 'Agricultural lime at 2 tons/ha. Equipment reserved.', cost: '$320', icon: '🌱' },
  { id: 4, title: 'Pest Trap Installation - Field Beta', type: 'monitoring', field: 'Field Beta', status: 'completed', priority: 'medium', assignedTo: 'Nguyen Van A', scheduledDate: '2026-05-28', completedDate: '2026-05-28', notes: 'Installed 12 pheromone traps across Zone B2. Baseline count: 15 moths/trap.', cost: '$95', icon: '🐛' },
  { id: 5, title: 'Nutrient Spray - Field Delta', type: 'fertilization', field: 'Field Delta', status: 'completed', priority: 'low', assignedTo: 'Pham Thi D', scheduledDate: '2026-05-25', completedDate: '2026-05-25', notes: 'Foliar NPK spray (20-20-20) at 3g/L. Applied during cool hours.', cost: '$120', icon: '🌿' },
  { id: 6, title: 'Harvest - Field Delta Zone D1', type: 'harvest', field: 'Field Delta', status: 'scheduled', priority: 'low', assignedTo: 'Team Alpha', scheduledDate: '2026-06-03', completedDate: null, notes: 'Estimated yield: 8 tons. Labor team confirmed.', cost: '$450', icon: '🍈' },
];

const STATUS_COLORS = {
  scheduled: '#38bdf8',
  in_progress: '#f59e0b',
  completed: '#4ade80',
  cancelled: '#ef4444',
};

const TYPE_LABELS = {
  treatment: 'Treatment',
  irrigation: 'Irrigation',
  soil_amendment: 'Soil Amendment',
  monitoring: 'Monitoring',
  fertilization: 'Fertilization',
  harvest: 'Harvest',
};

export default function InterventionsPage() {
  const { colors } = useTheme();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  const filtered = MOCK_INTERVENTIONS.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterType !== 'all' && i.type !== filterType) return false;
    return true;
  });

  const totalCost = MOCK_INTERVENTIONS.reduce((sum, i) => sum + parseInt(i.cost.replace('$', '')), 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="interventions-page">
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Interventions', value: MOCK_INTERVENTIONS.length, icon: '🔧', color: colors.info },
          { label: 'Completed', value: MOCK_INTERVENTIONS.filter(i => i.status === 'completed').length, icon: '✅', color: colors.success },
          { label: 'In Progress', value: MOCK_INTERVENTIONS.filter(i => i.status === 'in_progress').length, icon: '⏳', color: colors.warning },
          { label: 'Total Cost', value: `$${totalCost}`, icon: '💰', color: colors.primaryGlow },
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

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', 'scheduled', 'in_progress', 'completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${filterStatus === s ? colors.primary : colors.border}`,
              backgroundColor: filterStatus === s ? `${colors.primary}20` : 'transparent',
              color: filterStatus === s ? colors.primaryGlow : colors.textSecondary,
              fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
            }}>{s.replace('_', ' ')}</button>
          ))}
        </div>
        <button onClick={() => {
          // Add new intervention placeholder
        }} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          backgroundColor: colors.primary, color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
        }}>+ New Intervention</button>
      </div>

      {/* Intervention List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(intervention => {
          const statusColor = STATUS_COLORS[intervention.status];
          return (
            <div key={intervention.id} style={{
              padding: '18px 20px', borderRadius: 12,
              backgroundColor: colors.surface, border: `1px solid ${colors.border}`,
              boxShadow: SHADOWS.card, transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  backgroundColor: `${statusColor}15`, border: `1px solid ${statusColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>{intervention.icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      backgroundColor: `${statusColor}20`, color: statusColor,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{intervention.status.replace('_', ' ')}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      backgroundColor: `${colors.info}15`, color: colors.info,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{TYPE_LABELS[intervention.type]}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      backgroundColor: `${intervention.priority === 'high' ? colors.danger : intervention.priority === 'medium' ? colors.warning : colors.success}15`,
                      color: intervention.priority === 'high' ? colors.danger : intervention.priority === 'medium' ? colors.warning : colors.success,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{intervention.priority}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>{intervention.title}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{intervention.notes}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Field', value: intervention.field },
                      { label: 'Assigned', value: intervention.assignedTo },
                      { label: 'Scheduled', value: intervention.scheduledDate },
                      { label: 'Cost', value: intervention.cost },
                    ].map((meta, i) => (
                      <div key={i} style={{ fontSize: 11 }}>
                        <span style={{ color: colors.textMuted, fontWeight: 600 }}>{meta.label}: </span>
                        <span style={{ color: colors.textSecondary, fontWeight: 500 }}>{meta.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}