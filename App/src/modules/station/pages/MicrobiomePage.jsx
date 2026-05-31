/**
 * MicrobiomePage — SoilzePro Microbiome Analytics
 *
 * Wireframe: soilzepro-research/markdown-wireframes.md (Microbiome Analytics)
 * Soil composition, N-P-K nutrients, bacterial/fungal diversity charts
 */

import { useState } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';
import { SHADOWS } from '../../@core/constants/theme';

const MOCK_SOIL_SAMPLES = [
  { id: 1, field: 'Field Alpha', zone: 'Zone A1', depth: '0-15cm', date: '2026-05-28', ph: 6.2, moisture: 65, organic: 3.8, n: 45, p: 28, k: 35, bacteria: 850, fungi: 320, diversity: 0.82 },
  { id: 2, field: 'Field Beta', zone: 'Zone B2', depth: '0-15cm', date: '2026-05-27', ph: 5.8, moisture: 58, organic: 2.9, n: 32, p: 22, k: 28, bacteria: 620, fungi: 280, diversity: 0.71 },
  { id: 3, field: 'Field Gamma', zone: 'Zone C1', depth: '15-30cm', date: '2026-05-26', ph: 5.2, moisture: 42, organic: 2.1, n: 22, p: 15, k: 18, bacteria: 420, fungi: 180, diversity: 0.58 },
  { id: 4, field: 'Field Delta', zone: 'Zone D1', depth: '0-15cm', date: '2026-05-25', ph: 6.8, moisture: 72, organic: 4.5, n: 55, p: 35, k: 42, bacteria: 980, fungi: 410, diversity: 0.89 },
];

const NPK_COLORS = { n: '#38bdf8', p: '#f59e0b', k: '#a78bfa' };

export default function MicrobiomePage() {
  const { colors } = useTheme();
  const [selectedSample, setSelectedSample] = useState(MOCK_SOIL_SAMPLES[0]);

  const DonutChart = ({ value, max, color, label, unit }) => {
    const pct = Math.min((value / max) * 100, 100);
    const r = 36;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <svg width={84} height={84} viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={r} fill="none" stroke={`${colors.border}40`} strokeWidth="6" />
          <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 42 42)" />
          <text x="42" y="38" textAnchor="middle" fill={color} fontSize="14" fontWeight="800">{value}</text>
          <text x="42" y="52" textAnchor="middle" fill={colors.textMuted} fontSize="9" fontWeight="500">{unit}</text>
        </svg>
        <span style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>{label}</span>
      </div>
    );
  };

  const BarChart = ({ data, maxVal, colorFn }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {data.map((item, i) => {
          const pct = (item.value / maxVal) * 100;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 60, fontSize: 11, color: colors.textSecondary, fontWeight: 500 }}>{item.label}</div>
              <div style={{ flex: 1, height: 10, backgroundColor: `${colors.border}40`, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: colorFn(item.value, maxVal), borderRadius: 5 }} />
              </div>
              <div style={{ width: 40, textAlign: 'right', fontSize: 12, fontWeight: 700, color: colorFn(item.value, maxVal) }}>{item.value}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="microbiome-page">
      {/* Sample Selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {MOCK_SOIL_SAMPLES.map(s => (
          <button key={s.id} onClick={() => setSelectedSample(s)} style={{
            padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${selectedSample.id === s.id ? colors.primary : colors.border}`,
            backgroundColor: selectedSample.id === s.id ? `${colors.primary}20` : 'transparent',
            color: selectedSample.id === s.id ? colors.primaryGlow : colors.textSecondary,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
          }}>
            {s.field} — {s.zone}
          </button>
        ))}
      </div>

      {/* Soil Composition Donuts */}
      <div style={{
        padding: 20, borderRadius: 12,
        backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: SHADOWS.card,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🧪</span> Soil Composition — {selectedSample.field} ({selectedSample.depth})
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          <DonutChart value={selectedSample.ph} max={14} color={colors.info} label="pH Level" unit="pH" />
          <DonutChart value={selectedSample.moisture} max={100} color={colors.primaryGlow} label="Moisture" unit="%" />
          <DonutChart value={selectedSample.organic} max={10} color={colors.warning} label="Organic Matter" unit="%" />
          <DonutChart value={selectedSample.diversity} max={1} color={colors.success} label="Diversity Index" unit={selectedSample.diversity.toFixed(2)} />
        </div>
      </div>

      {/* NPK + Microbial */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* NPK Chart */}
        <div style={{
          flex: '1 1 350px', padding: 20, borderRadius: 12,
          backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: SHADOWS.card,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🌱</span> Nutrient Analysis (N-P-K)
          </div>
          <BarChart
            data={[
              { label: 'Nitrogen', value: selectedSample.n },
              { label: 'Phosphorus', value: selectedSample.p },
              { label: 'Potassium', value: selectedSample.k },
            ]}
            maxVal={80}
            colorFn={(v, max) => v / max > 0.7 ? colors.success : v / max > 0.4 ? colors.warning : colors.danger}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
            {Object.entries(NPK_COLORS).map(([key, color]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <span style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Microbial Diversity */}
        <div style={{
          flex: '1 1 350px', padding: 20, borderRadius: 12,
          backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: SHADOWS.card,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🦠</span> Microbial Population
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: 16 }}>
            <DonutChart value={selectedSample.bacteria} max={1200} color={colors.info} label="Bacteria" unit="CFU/g" />
            <DonutChart value={selectedSample.fungi} max={600} color={colors.primaryGlow} label="Fungi" unit="CFU/g" />
          </div>
          <div style={{
            marginTop: 16, padding: '12px 14px', borderRadius: 8,
            backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.primary}20`,
            fontSize: 12, color: colors.textSecondary, lineHeight: 1.5,
          }}>
            <strong style={{ color: colors.primaryGlow }}>Assessment:</strong> {selectedSample.diversity > 0.7
              ? 'Healthy soil microbiome with good bacterial-fungal balance. Maintain current practices.'
              : 'Reduced microbial diversity detected. Consider organic amendments and reduced tillage.'}
          </div>
        </div>
      </div>

      {/* Soil Health Timeline */}
      <div style={{
        padding: 20, borderRadius: 12,
        backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: SHADOWS.card,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📊</span> Soil Health Trends
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {MOCK_SOIL_SAMPLES.map((s, i) => (
            <div key={s.id} style={{
              minWidth: 180, padding: '14px', borderRadius: 10,
              backgroundColor: selectedSample.id === s.id ? `${colors.primary}15` : colors.surfaceHover,
              border: `1px solid ${selectedSample.id === s.id ? colors.primary : colors.border}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }} onClick={() => setSelectedSample(s)}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textPrimary }}>{s.field}</div>
              <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 8 }}>{s.date}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.textSecondary }}>
                <span>pH {s.ph}</span>
                <span style={{ color: s.diversity > 0.7 ? colors.success : colors.warning, fontWeight: 700 }}>
                  {(s.diversity * 100).toFixed(0)}% diversity
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}