/**
 * Design tokens — single source of truth for all platforms.
 * Premium SoilzePro-inspired Agriculture theme.
 *
 * DARK_COLORS / LIGHT_COLORS are the full palette maps.
 * COLORS is a convenience alias that always reflects DARK_COLORS
 * (the ThemeContext resolves the correct map at runtime).
 *
 * Status colors follow HSL-soft variants for backgrounds and
 * vibrant fills for indicators — matching SoilzePro conventions.
 */

export const DARK_COLORS = {
  // Backgrounds
  background: '#0a1628',        // Deep navy — main shell
  surface: '#0f2040',           // Darkened forest card surface
  surfaceHover: '#162b50',      // Hover state for cards / nav
  surfaceAlt: '#1a3060',        // Elevated surfaces (modals, dropdowns)

  // Brand — Premium Forest Green
  primary: '#2C5E43',           // Forest green (SoilzePro signature)
  primaryLight: '#3d8a60',      // Lighter green for hover/focus
  primaryGlow: '#4ade80',       // Vibrant leaf green for indicators/badges
  secondary: '#1E3F20',         // Deep forest for gradient base

  // Text
  textPrimary: '#e8f5ee',       // Soft white-green for headings
  textSecondary: '#7ca99c',     // Muted sage for labels
  textMuted: '#4a7a68',         // Dimmed text for placeholders

  // Status palette
  success: '#4ade80',           // Healthy crops / normal readings
  successBg: '#0d2a1a',        // Card bg for success state
  successBorder: '#2C5E43',    // Border for success card
  warning: '#f59e0b',           // Warning — moderate stress
  warningBg: '#261a00',        // Card bg for warning
  warningBorder: '#78450c',    // Border for warning card
  danger: '#ef4444',            // Critical alert / disease detected
  dangerBg: '#250e0e',         // Card bg for danger state
  dangerBorder: '#7f1d1d',     // Border for danger card
  info: '#38bdf8',              // Informational / IoT data
  infoBg: '#0a1f2e',           // Card bg for info state

  // Structural
  border: '#1e3a2d',            // Soft forest green border
  borderStrong: '#2C5E43',      // Highlighted borders
  placeholder: '#4a7a68',
  black: '#000000',
  white: '#ffffff',

  // Gradients (used as CSS gradient strings)
  gradientPrimary: 'linear-gradient(135deg, #1E3F20 0%, #2C5E43 100%)',
  gradientCard: 'linear-gradient(160deg, #0f2040 0%, #0a1628 100%)',
};

export const LIGHT_COLORS = {
  // Backgrounds
  background: '#f0f7f4',        // Soft off-white sage
  surface: '#ffffff',           // Pure white cards
  surfaceHover: '#e8f5ee',      // Hover tint
  surfaceAlt: '#f8fdf9',        // Elevated surfaces

  // Brand — Premium Forest Green (same as dark)
  primary: '#2C5E43',
  primaryLight: '#3d8a60',
  primaryGlow: '#16a34a',       // Slightly deeper for light bg contrast
  secondary: '#1E3F20',

  // Text
  textPrimary: '#0d2215',       // Near-black forest text
  textSecondary: '#4a7a68',     // Sage gray labels
  textMuted: '#7ca99c',         // Dimmed labels

  // Status palette (same semantics, lighter backgrounds)
  success: '#16a34a',
  successBg: '#dcfce7',
  successBorder: '#86efac',
  warning: '#d97706',
  warningBg: '#fef9c3',
  warningBorder: '#fde047',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#fca5a5',
  info: '#0369a1',
  infoBg: '#e0f2fe',

  // Structural
  border: '#d1fae5',
  borderStrong: '#2C5E43',
  placeholder: '#9ca3af',
  black: '#000000',
  white: '#ffffff',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #1E3F20 0%, #2C5E43 100%)',
  gradientCard: 'linear-gradient(160deg, #ffffff 0%, #f0f7f4 100%)',
};

// Default export alias — resolved by ThemeContext at runtime
export const COLORS = DARK_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 12,  // Bumped for premium SoilzePro rounded feel
  lg: 16,
  xl: 20,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
};

// Shadow presets (CSS box-shadow strings)
export const SHADOWS = {
  card: '0 2px 12px rgba(0,0,0,0.35)',
  cardHover: '0 6px 24px rgba(0,0,0,0.5)',
  glow: '0 0 20px rgba(44,94,67,0.4)',
  glowLight: '0 0 20px rgba(44,94,67,0.15)',
};

