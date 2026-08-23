/**
 * ThemeContext — Global Theme & Contrast System
 *
 * Supports 3 Contrast Modes:
 *   - 'dark':     OLED Pitch Dark (Battery saver, thermal efficiency)
 *   - 'sunlight': Extreme High-Contrast White (Direct sunlight outdoor)
 *   - 'natural':  Soft Agronomic Sage (Indoor comfortable)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { THEME_MODES, MOBILE_PALETTES } from '../../agrivision/constants/mobileTheme';

const STORAGE_KEY = 'cropvision_mobile_theme_mode';

const ThemeContext = createContext({
  themeMode: THEME_MODES.DARK,
  colors: MOBILE_PALETTES[THEME_MODES.DARK],
  isDark: true,
  isSunlight: false,
  isNatural: false,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(THEME_MODES.DARK);

  // Load saved theme on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const saved = window.localStorage?.getItem(STORAGE_KEY);
          if (saved && MOBILE_PALETTES[saved]) {
            setThemeModeState(saved);
            return;
          }
        } else {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (saved && MOBILE_PALETTES[saved]) {
            setThemeModeState(saved);
            return;
          }
        }
      } catch (_) {}
    }
    loadTheme();
  }, []);

  // Save theme on change
  const setThemeMode = useCallback(async (mode) => {
    if (!MOBILE_PALETTES[mode]) return;
    setThemeModeState(mode);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage?.setItem(STORAGE_KEY, mode);
        document.documentElement.setAttribute('data-theme', mode);
        document.body.style.backgroundColor = MOBILE_PALETTES[mode].background;
      } else {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem(STORAGE_KEY, mode);
      }
    } catch (_) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((curr) => {
      const next = curr === THEME_MODES.DARK ? THEME_MODES.SUNLIGHT : THEME_MODES.DARK;
      setThemeMode(next);
      return next;
    });
  }, [setThemeMode]);

  const activeColors = MOBILE_PALETTES[themeMode] || MOBILE_PALETTES[THEME_MODES.DARK];
  const isDark = themeMode === THEME_MODES.DARK;
  const isSunlight = themeMode === THEME_MODES.SUNLIGHT;
  const isNatural = themeMode === THEME_MODES.NATURAL;

  const value = {
    themeMode,
    colors: activeColors,
    isDark,
    isSunlight,
    isNatural,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
