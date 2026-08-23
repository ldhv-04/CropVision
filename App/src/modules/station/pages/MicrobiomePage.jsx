/**
 * MicrobiomePage — Tactical Rhizosphere & Soil Microbiome Intelligence
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Soil biology composition, N-P-K nutrient spectrum, bacterial/fungal diversity ratios.
 */

import React, { useState } from 'react';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

const MOCK_SOIL_SAMPLES = [
  { id: 1, field: 'Sector Alpha', zone: 'Zone A1', depth: '0-15cm', date: '2026-05-28', ph: 6.2, moisture: 65, organic: 3.8, n: 45, p: 28, k: 35, bacteria: 850, fungi: 320, diversity: 0.82 },
  { id: 2, field: 'Sector Beta', zone: 'Zone B2', depth: '0-15cm', date: '2026-05-27', ph: 5.8, moisture: 58, organic: 2.9, n: 32, p: 22, k: 28, bacteria: 620, fungi: 280, diversity: 0.71 },
  { id: 3, field: 'Sector Gamma', zone: 'Zone C1', depth: '15-30cm', date: '2026-05-26', ph: 5.2, moisture: 42, organic: 2.1, n: 22, p: 15, k: 18, bacteria: 420, fungi: 180, diversity: 0.58 },
  { id: 4, field: 'Sector Delta', zone: 'Zone D1', depth: '0-15cm', date: '2026-05-25', ph: 6.8, moisture: 72, organic: 4.5, n: 55, p: 35, k: 42, bacteria: 980, fungi: 410, diversity: 0.89 },
];

const NPK_COLORS = { n: TACTICAL_THEME.satellite, p: TACTICAL_THEME.telemetry, k: TACTICAL_THEME.violet };

export default function MicrobiomePage() {
  const [selectedSample, setSelectedSample] = useState(MOCK_SOIL_SAMPLES[0]);

  const DonutChart = ({ value, max, color, label, unit }) => {
    const pct = Math.min((value / max) * 100, 100);
    const r = 36;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <svg width={88} height={88} viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="6" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
          <text x="44" y="42" textAnchor="middle" fill={TACTICAL_THEME.textPrimary} fontSize="14" fontWeight="900" fontFamily={TACTICAL_THEME.fontMono}>{value}</text>
          <text x="44" y="56" textAnchor="middle" fill={TACTICAL_THEME.textMuted} fontSize="8.5" fontWeight="700" fontFamily={TACTICAL_THEME.fontMono}>{unit}</text>
        </svg>
        <span style={{ fontSize: 10, color: TACTICAL_THEME.textSecondary, fontWeight: 700, fontFamily: TACTICAL_THEME.fontMono }}>{label}</span>
      </div>
    );
  };

  const BarChart = ({ data, maxVal, colorFn }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        {data.map((item, i) => {
          const pct = (item.value / maxVal) * 100;
          const col = colorFn(item.value, maxVal);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 80, fontSize: 11, color: TACTICAL_THEME.textSecondary, fontWeight: 600 }}>{item.label}</div>
              <div style={{ flex: 1, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 4, overflow: 'hidden', border: `1px solid ${TACTICAL_THEME.borderSubtle}` }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: col, borderRadius: 4, boxShadow: `0 0 8px ${col}60` }} />
              </div>
              <div style={{ width: 50, textAlign: 'right', fontSize: 12, fontWeight: 800, color: col, fontFamily: TACTICAL_THEME.fontMono }}>{item.value} ppm</div>
            </div>
          );
        })}
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
    }} data-testid="microbiome-page">
      {/* Sample Selector Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {MOCK_SOIL_SAMPLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSample(s)}
            style={{
              padding: '7px 14px',
              borderRadius: 4,
              border: `1px solid ${selectedSample.id === s.id ? TACTICAL_THEME.violet : TACTICAL_THEME.border}`,
              backgroundColor: selectedSample.id === s.id ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              color: selectedSample.id === s.id ? TACTICAL_THEME.violet : TACTICAL_THEME.textSecondary,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: TACTICAL_THEME.fontMono,
            }}
          >
            {s.field} — {s.zone}
          </button>
        ))}
      </div>

      {/* Soil Composition Matrix */}
      <div style={{
        padding: 20,
        borderRadius: 8,
        backgroundColor: TACTICAL_THEME.bgPanel,
        border: `1px solid ${TACTICAL_THEME.border}`,
        boxShadow: TACTICAL_THEME.shadowPanel,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 800,
          color: TACTICAL_THEME.textPrimary,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${TACTICAL_THEME.border}`,
          paddingBottom: 10,
          fontFamily: TACTICAL_THEME.fontMono,
        }}>
          <span>🧪 RHIZOSPHERE SPECIMEN — {selectedSample.field} (CORE DEPTH: {selectedSample.depth})</span>
          <span style={{ fontSize: 9, color: TACTICAL_THEME.violet }}>SAMPLE ID: SPEC-{selectedSample.id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          <DonutChart value={selectedSample.ph} max={14} color={TACTICAL_THEME.satellite} label="pH REACTION" unit="pH" />
          <DonutChart value={selectedSample.moisture} max={100} color={TACTICAL_THEME.radar} label="MOISTURE" unit="%" />
          <DonutChart value={selectedSample.organic} max={10} color={TACTICAL_THEME.telemetry} label="ORGANIC CARBON" unit="%" />
          <DonutChart value={selectedSample.diversity} max={1} color={TACTICAL_THEME.violet} label="SHANNON DIVERSITY" unit={selectedSample.diversity.toFixed(2)} />
        </div>
      </div>

      {/* NPK + Microbial Spectrum Grid */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* NPK Chart */}
        <div style={{
          flex: '1 1 350px',
          padding: 20,
          borderRadius: 8,
          backgroundColor: TACTICAL_THEME.bgPanel,
          border: `1px solid ${TACTICAL_THEME.border}`,
          boxShadow: TACTICAL_THEME.shadowPanel,
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: TACTICAL_THEME.textPrimary,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: TACTICAL_THEME.fontMono,
          }}>
            <span>🌱</span> PRIMARY NUTRIENT SPECTRUM (N-P-K)
          </div>
          <BarChart
            data={[
              { label: 'Nitrogen (N)', value: selectedSample.n },
              { label: 'Phosphorus (P)', value: selectedSample.p },
              { label: 'Potassium (K)', value: selectedSample.k },
            ]}
            maxVal={80}
            colorFn={(v, max) => v / max > 0.7 ? TACTICAL_THEME.radar : v / max > 0.4 ? TACTICAL_THEME.telemetry : TACTICAL_THEME.alert}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
            {Object.entries(NPK_COLORS).map(([key, color]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontSize: 9, color: TACTICAL_THEME.textMuted, textTransform: 'uppercase', fontWeight: 800, fontFamily: TACTICAL_THEME.fontMono }}>{key} VECTOR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Microbial Diversity */}
        <div style={{
          flex: '1 1 350px',
          padding: 20,
          borderRadius: 8,
          backgroundColor: TACTICAL_THEME.bgPanel,
          border: `1px solid ${TACTICAL_THEME.border}`,
          boxShadow: TACTICAL_THEME.shadowPanel,
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: TACTICAL_THEME.textPrimary,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: TACTICAL_THEME.fontMono,
          }}>
            <span>🦠</span> BIOLOGICAL POPULATION (CFU)
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: 16 }}>
            <DonutChart value={selectedSample.bacteria} max={1200} color={TACTICAL_THEME.satellite} label="BACTERIAL COLONIES" unit="CFU/g" />
            <DonutChart value={selectedSample.fungi} max={600} color={TACTICAL_THEME.violet} label="MYCORRHIZAL FUNGI" unit="CFU/g" />
          </div>
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 6,
            backgroundColor: 'rgba(167, 139, 250, 0.08)',
            border: `1px solid rgba(167, 139, 250, 0.25)`,
            fontSize: 11,
            color: TACTICAL_THEME.textSecondary,
            lineHeight: 1.5,
          }}>
            <strong style={{ color: TACTICAL_THEME.violet }}>AGRONOMIC ASSESSMENT:</strong> {selectedSample.diversity > 0.7
              ? 'High microbial resilience with balanced rhizosphere equilibrium. Maintain organic amendments.'
              : 'Sub-optimal biological diversity detected. Recommend humic inoculation and reduced compaction.'}
          </div>
        </div>
      </div>
    </div>
  );
}
