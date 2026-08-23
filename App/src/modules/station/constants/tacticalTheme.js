/**
 * Station Module — Tactical Agronomy Command Theme Tokens
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Single source of visual truth for all Station components.
 */

export const TACTICAL_THEME = {
  // Backgrounds
  bgBase: '#06090E',             // Deep obsidian night base
  bgPanel: 'rgba(13, 19, 32, 0.92)', // Frosted mission control panel
  bgPanelSolid: '#0D1320',       // Solid panel fallback
  bgPanelElevated: '#141D30',    // Modals, drawers, elevated cards
  bgPanelHover: '#1B2740',       // Hover states
  bgInput: 'rgba(6, 9, 14, 0.75)',// Input fields

  // Borders & Grid Lines
  border: '#1B2537',             // Hairline panel border
  borderSubtle: '#121A27',       // Subtle section dividers
  borderHighlight: '#00F5A0',    // Active / focused highlight border
  borderGlow: 'rgba(0, 245, 160, 0.35)',

  // Brand & Status Accents (High-Contrast HUD Colors)
  radar: '#00F5A0',              // Radar Emerald — Nominal / Optimal / Target
  radarMuted: 'rgba(0, 245, 160, 0.15)',
  radarGlow: '0 0 12px rgba(0, 245, 160, 0.45)',
  
  telemetry: '#FFB300',          // Telemetry Amber — Warning / Elevated Risk
  telemetryMuted: 'rgba(255, 179, 0, 0.15)',
  telemetryGlow: '0 0 12px rgba(255, 179, 0, 0.45)',

  alert: '#FF2E54',              // Alert Crimson — Outbreak / Critical / P1 Incident
  alertMuted: 'rgba(255, 46, 84, 0.15)',
  alertGlow: '0 0 12px rgba(255, 46, 84, 0.45)',

  satellite: '#00D2FF',          // Satellite Cyan — GIS / GPS / Vector Layers
  satelliteMuted: 'rgba(0, 210, 255, 0.15)',
  satelliteGlow: '0 0 12px rgba(0, 210, 255, 0.45)',

  violet: '#A78BFA',             // Microbiome & Advanced Diagnostics
  violetMuted: 'rgba(167, 139, 250, 0.15)',

  // Text Hierarchy
  textPrimary: '#F8FAFC',        // Bright white-slate for primary readouts
  textSecondary: '#94A3B8',      // Slate for descriptions and labels
  textMuted: '#475569',          // Dimmed telemetry timestamps and units

  // Shadows
  shadowPanel: '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 1px rgba(0, 245, 160, 0.1)',
  shadowGlow: '0 0 20px rgba(0, 245, 160, 0.2)',

  // Fonts
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontMono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
};

export default TACTICAL_THEME;
