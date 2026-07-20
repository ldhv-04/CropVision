/**
 * RecommendationsPage — SoilzePro AI Recommendations
 *
 * Wireframe: soilzepro-research/markdown-wireframes.md (Recommendations)
 * AI-powered farming insights with approve/dismiss workflow
 */

import { useState } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';
import { SHADOWS } from '../../@core/constants/theme';

const MOCK_RECOMMENDATIONS = [
  { id: 1, title: 'Apply Fungicide to Zone A3', priority: 'high', category: 'disease', field: 'Field Alpha', zone: 'Zone A3', description: 'Leaf blight detected with 87% confidence. Immediate fungicide application recommended to prevent spread to adjacent zones.', reasoning: 'Historical data shows 3x spread rate without treatment within 48h. Current weather conditions (high humidity, 32°C) favor fungal growth.', status: 'pending', created: '2h ago', icon: '🦠' },
  { id: 2, title: 'Increase Irrigation - Field Epsilon', priority: 'high', category: 'irrigation', field: 'Field Epsilon', zone: 'Zone E1', description: 'Soil moisture dropped to 28%, well below the 45% threshold for cashew cultivation. Root stress indicators detected.', reasoning: 'Weather forecast shows no rain for 5 days. Current irrigation schedule insufficient for evapotranspiration rate.', status: 'pending', created: '3h ago', icon: '💧' },
  { id: 3, title: 'Soil Amendment - Field Gamma', priority: 'medium', category: 'soil', field: 'Field Gamma', zone: 'Zone C1', description: 'pH level at 5.2 is below optimal range (5.5-6.5) for pepper. Calcium carbonate application recommended.', reasoning: 'Low pH reduces nutrient availability by up to 40%. Last lime application was 6 months ago.', status: 'pending', created: '1d ago', icon: '🧪' },
  { id: 4, title: 'Harvest Window - Field Delta', priority: 'low', category: 'harvest', field: 'Field Delta', zone: 'Zone D1', description: 'Durian fruit maturity indicators suggest optimal harvest window in 3-5 days. Weather conditions are favorable.', reasoning: 'Sugar content readings approaching 32 Brix. No adverse weather expected. Labor availability confirmed.', status: 'approved', created: '2d ago', icon: '🍈' },
  { id: 5, title: 'Pest Monitoring - Field Beta', priority: 'medium', category: 'pest', field: 'Field Beta', zone: 'Zone B2', description: 'Increased insect activity detected on sensors. Preventive neem oil spray recommended before population reaches threshold.', reasoning: 'Light trap data shows 2x normal moth count. Coffee berry borer season typically peaks in 2 weeks.', status: 'pending', created: '3d ago', icon: '🐛' },
];

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#4ade80' };
const STATUS_LABELS = { pending: 'Pending Review', approved: 'Approved', dismissed: 'Dismissed', completed: 'Completed' };

export default function RecommendationsPage() {
  const { colors } = useTheme();
  const [recommendations, setRecommendations] = useState(MOCK_RECOMMENDATIONS);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const handleAction = (id, action) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const filtered = recommendations.filter(r => {
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="recommendations-page">
      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: recommendations.length, icon: '💡', color: colors.info },
          { label: 'Pending', value: recommendations.filter(r => r.status === 'pending').length, icon: '⏳', color: colors.warning },
          { label: 'High Priority', value: recommendations.filter(r => r.priority === 'high' && r.status === 'pending').length, icon: '🔴', color: colors.danger },
          { label: 'Approved', value: recommendations.filter(r => r.status === 'approved').length, icon: '✅', color: colors.success },
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
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'high', 'medium', 'low'].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)} style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${filterPriority === p ? colors.primary : colors.border}`,
              backgroundColor: filterPriority === p ? `${colors.primary}20` : 'transparent',
              color: filterPriority === p ? colors.primaryGlow : colors.textSecondary,
              fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
            }}>{p}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'pending', 'approved', 'dismissed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${filterStatus === s ? colors.primary : colors.border}`,
              backgroundColor: filterStatus === s ? `${colors.primary}20` : 'transparent',
              color: filterStatus === s ? colors.primaryGlow : colors.textSecondary,
              fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Recommendation Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(rec => {
          const isExpanded = expandedId === rec.id;
          const priorityColor = PRIORITY_COLORS[rec.priority];

          return (
            <div key={rec.id} style={{
              borderRadius: 12, backgroundColor: colors.surface,
              border: `1px solid ${isExpanded ? colors.primary : colors.border}`,
              boxShadow: isExpanded ? SHADOWS.glow : SHADOWS.card,
              overflow: 'hidden', transition: 'all 0.2s ease',
            }}>
              {/* Card Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px',
                  cursor: 'pointer', transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: 24 }}>{rec.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      backgroundColor: `${priorityColor}20`, color: priorityColor,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{rec.priority}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      backgroundColor: rec.status === 'approved' ? `${colors.success}20` : rec.status === 'dismissed' ? `${colors.danger}20` : `${colors.warning}20`,
                      color: rec.status === 'approved' ? colors.success : rec.status === 'dismissed' ? colors.danger : colors.warning,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{STATUS_LABELS[rec.status]}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{rec.title}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{rec.field} · {rec.zone} · {rec.created}</div>
                </div>
                <span style={{ fontSize: 12, color: colors.textMuted, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</div>
                      <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>{rec.description}</div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: `${colors.info}10`, border: `1px solid ${colors.info}20` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: colors.info, marginBottom: 6 }}>🤖 AI Reasoning</div>
                      <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>{rec.reasoning}</div>
                    </div>
                    {rec.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => handleAction(rec.id, 'approved')} style={{
                          flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                          backgroundColor: colors.success, color: '#fff', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
                        }}>✅ Approve</button>
                        <button onClick={() => handleAction(rec.id, 'dismissed')} style={{
                          flex: 1, padding: '10px', borderRadius: 8,
                          border: `1px solid ${colors.border}`, backgroundColor: 'transparent',
                          color: colors.textSecondary, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
                        }}>✕ Dismiss</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}