/**
 * colorScales — Metric value → hex color mapping for map polygon rendering.
 *
 * Each layer has its own color scale with configurable ranges.
 * Supports both discrete (disease) and continuous (moisture, pH, N, temp) scales.
 */

// ── Helper: linear interpolation between two hex colors ──
function interpolateColor(colorA, colorB, t) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex(r, g, bl);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ── Multi-stop gradient ──
function multiStopGradient(stops, value) {
  if (value <= stops[0].value) return stops[0].color;
  if (value >= stops[stops.length - 1].value) return stops[stops.length - 1].color;

  for (let i = 0; i < stops.length - 1; i++) {
    if (value >= stops[i].value && value <= stops[i + 1].value) {
      const t = (value - stops[i].value) / (stops[i + 1].value - stops[i].value);
      return interpolateColor(stops[i].color, stops[i + 1].color, t);
    }
  }
  return stops[stops.length - 1].color;
}

// ── Layer: Disease Risk (discrete 3-state) ──
export function diseaseColor(zoneStatus) {
  const map = {
    HEALTHY: '#10b981',  // green
    WARNING: '#f59e0b',  // amber
    INFECTED: '#ef4444', // red
  };
  return map[zoneStatus] || '#6b7280'; // gray fallback
}

// ── Layer: Soil Moisture (%) ──
// 0% = dry (brown) → 40% = optimal (green) → 100% = saturated (blue)
const MOISTURE_STOPS = [
  { value: 0, color: '#8B4513' },   // saddle brown (dry)
  { value: 20, color: '#D2691E' },  // chocolate
  { value: 40, color: '#228B22' },  // forest green (optimal low)
  { value: 60, color: '#32CD32' },  // lime green (optimal high)
  { value: 80, color: '#4169E1' },  // royal blue
  { value: 100, color: '#000080' }, // navy (saturated)
];

export function moistureColor(value) {
  return multiStopGradient(MOISTURE_STOPS, Math.max(0, Math.min(100, value)));
}

// ── Layer: Soil pH ──
// 4.0 (acidic/red) → 6.5 (slightly acidic/yellow) → 7.0 (neutral/green) → 7.5 (slightly alkaline/cyan) → 9.0 (alkaline/purple)
const PH_STOPS = [
  { value: 4.0, color: '#ef4444' }, // red (very acidic)
  { value: 5.5, color: '#f97316' }, // orange
  { value: 6.5, color: '#eab308' }, // yellow
  { value: 7.0, color: '#22c55e' }, // green (neutral - optimal)
  { value: 7.5, color: '#06b6d4' }, // cyan
  { value: 9.0, color: '#8b5cf6' }, // purple (very alkaline)
];

export function phColor(value) {
  return multiStopGradient(PH_STOPS, Math.max(4.0, Math.min(9.0, value)));
}

// ── Layer: Nitrogen (mg/kg) ──
// 0 = deficient (red) → 40 = low (orange) → 60 = adequate (yellow) → 80+ = high (green)
const NITROGEN_STOPS = [
  { value: 0, color: '#ef4444' },   // red (deficient)
  { value: 20, color: '#f97316' },  // orange (very low)
  { value: 40, color: '#eab308' },  // yellow (low)
  { value: 60, color: '#84cc16' },  // lime (adequate)
  { value: 80, color: '#22c55e' },  // green (good)
  { value: 100, color: '#059669' }, // emerald (high)
];

export function nitrogenColor(value) {
  return multiStopGradient(NITROGEN_STOPS, Math.max(0, Math.min(100, value)));
}

// ── Layer: Temperature (°C) ──
// 10°C = cold (blue) → 20°C = cool (cyan) → 25°C = optimal (green) → 30°C = warm (yellow) → 40°C+ = hot (red)
const TEMPERATURE_STOPS = [
  { value: 10, color: '#3b82f6' },  // blue (cold)
  { value: 18, color: '#06b6d4' },  // cyan (cool)
  { value: 25, color: '#22c55e' },  // green (optimal)
  { value: 30, color: '#eab308' },  // yellow (warm)
  { value: 35, color: '#f97316' },  // orange (hot)
  { value: 40, color: '#ef4444' },  // red (very hot)
];

export function temperatureColor(value) {
  return multiStopGradient(TEMPERATURE_STOPS, Math.max(10, Math.min(40, value)));
}

// ── Unified color function ──
const COLOR_SCALES = {
  disease: (value) => diseaseColor(value),
  moisture: (value) => moistureColor(value),
  ph: (value) => phColor(value),
  nitrogen: (value) => nitrogenColor(value),
  temperature: (value) => temperatureColor(value),
};

/**
 * Get polygon fill color for a zone based on the active layer.
 *
 * @param {'disease'|'moisture'|'ph'|'nitrogen'|'temperature'} layer
 * @param {number|string} value - metric value or zone status for disease layer
 * @returns {string} hex color
 */
export function getZoneColor(layer, value) {
  const scaleFn = COLOR_SCALES[layer];
  if (!scaleFn) return '#6b7280'; // gray fallback
  return scaleFn(value);
}

// ── Legend definitions ──
export const LAYER_LEGENDS = {
  disease: {
    label: 'Disease Risk',
    unit: '',
    type: 'discrete',
    stops: [
      { color: '#10b981', label: 'Healthy' },
      { color: '#f59e0b', label: 'Warning' },
      { color: '#ef4444', label: 'Infected' },
    ],
  },
  moisture: {
    label: 'Soil Moisture',
    unit: '%',
    type: 'continuous',
    min: 0,
    max: 100,
    gradient: ['#8B4513', '#D2691E', '#228B22', '#32CD32', '#4169E1', '#000080'],
  },
  ph: {
    label: 'Soil pH',
    unit: '',
    type: 'continuous',
    min: 4.0,
    max: 9.0,
    gradient: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'],
  },
  nitrogen: {
    label: 'Nitrogen',
    unit: 'mg/kg',
    type: 'continuous',
    min: 0,
    max: 100,
    gradient: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#059669'],
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    type: 'continuous',
    min: 10,
    max: 40,
    gradient: ['#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#f97316', '#ef4444'],
  },
};

export default {
  getZoneColor,
  diseaseColor,
  moistureColor,
  phColor,
  nitrogenColor,
  temperatureColor,
  LAYER_LEGENDS,
};