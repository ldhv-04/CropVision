/**
 * Theme Contrast & Sunlight Mode Verification Tests
 * Validates WCAG AAA contrast ratio compliance (>= 7:1) for field readability.
 * Strictly adheres to Rule 2.4 and Rule 2.12.
 */

import { MOBILE_PALETTES, THEME_MODES, LIGHT_COLORS, DARK_COLORS } from '../src/modules/@core/constants/theme';

/**
 * Calculates luminance for a hex color string (#RRGGBB).
 */
function getRelativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Theme Contrast & WCAG Compliance', () => {
  test('Sunlight mode achieves WCAG AAA (>= 7:1) contrast ratio', () => {
    const sunlight = MOBILE_PALETTES[THEME_MODES.SUNLIGHT];
    expect(sunlight).toBeDefined();

    const contrastRatio = getContrastRatio(sunlight.background, sunlight.textPrimary);
    // Absolute black on white is 21:1
    expect(contrastRatio).toBeGreaterThanOrEqual(7.0);
  });

  test('All theme modes define required color tokens', () => {
    const modes = [THEME_MODES.SUNLIGHT, THEME_MODES.DARK, THEME_MODES.NATURAL];
    for (const mode of modes) {
      const palette = MOBILE_PALETTES[mode];
      expect(palette).toBeDefined();
      expect(palette.background).toBeDefined();
      expect(palette.surface).toBeDefined();
      expect(palette.primary).toBeDefined();
      expect(palette.textPrimary).toBeDefined();
      expect(palette.border).toBeDefined();
    }
  });

  test('Dark and Light core palettes have appropriate semantic text contrast', () => {
    const lightRatio = getContrastRatio(LIGHT_COLORS.background, LIGHT_COLORS.textPrimary);
    expect(lightRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA minimum

    const darkRatio = getContrastRatio(DARK_COLORS.background, DARK_COLORS.textPrimary);
    expect(darkRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA minimum
  });
});
