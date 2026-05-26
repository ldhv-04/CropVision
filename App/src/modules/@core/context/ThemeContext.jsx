/**
 * ThemeContext — Global dark / light mode system.
 *
 * Provides:
 *   - `colors`      — active palette (DARK_COLORS or LIGHT_COLORS)
 *   - `isDark`      — boolean
 *   - `toggleTheme` — flip between modes
 *
 * Persists the preference to localStorage (web) so it survives refresh.
 *
 * Usage:
 *   import { useTheme } from './ThemeContext';
 *   const { colors, isDark, toggleTheme } = useTheme();
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';

const STORAGE_KEY = 'cropvision_theme';

const ThemeContext = createContext({
  colors: DARK_COLORS,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage?.getItem(STORAGE_KEY);
      if (saved !== null) return saved === 'dark';
      // Respect OS preference as default
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    }
    return true;
  });

  // Sync CSS custom properties to <html> for any future CSS usage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.body.style.backgroundColor = isDark
      ? DARK_COLORS.background
      : LIGHT_COLORS.background;
    try {
      window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (_) {}
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);

  const value = {
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Convenience hook — use this everywhere instead of importing COLORS directly. */
export function useTheme() {
  return useContext(ThemeContext);
}
