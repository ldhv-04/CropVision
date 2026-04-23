/**
 * useLayoutMode — Platform Module
 *
 * Returns the current responsive layout mode based on window width.
 * Centralises all breakpoint decisions — eliminates scattered
 * isCompactLayout / isPhoneLayout inline checks across screens.
 *
 * Breakpoints:
 *   phone   → width < 768
 *   tablet  → 768 ≤ width < 1180
 *   desktop → width ≥ 1180
 */

import { useWindowDimensions } from 'react-native';

const BREAKPOINTS = {
  phone:   0,
  tablet:  768,
  desktop: 1180,
};

export const useLayoutMode = () => {
  const { width, height } = useWindowDimensions();

  const mode =
    width >= BREAKPOINTS.desktop ? 'desktop' :
    width >= BREAKPOINTS.tablet  ? 'tablet'  :
                                   'phone';

  return {
    mode,
    isPhone:   mode === 'phone',
    isTablet:  mode === 'tablet',
    isDesktop: mode === 'desktop',
    isCompact: mode !== 'desktop',  // tablet + phone share compact layouts
    width,
    height,
    BREAKPOINTS,
  };
};
