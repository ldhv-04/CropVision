/**
 * usePlatformInfo — Layer 1 Core (Platform Module)
 *
 * Returns the detected runtime environment.
 * Uses window.electronAPI presence (injected by preload.js) to distinguish
 * Electron from plain web browser — both report Platform.OS === 'web'.
 *
 * Returns:
 *   platform: 'web' | 'electron' | 'ios' | 'android' | 'unknown'
 *   isNative: boolean
 *   isWeb: boolean
 *   isDesktop: boolean (Electron)
 *   isElectron: boolean
 *   hasHover: boolean  — true for web + electron (mouse capable)
 *   hasNativeFS: boolean — true only for electron (via IPC)
 */

import { getRuntimePlatform } from '../runtime';

export const usePlatformInfo = () => {
  const platform = getRuntimePlatform();

  return {
    platform,
    isNative:     platform === 'ios' || platform === 'android',
    isWeb:        platform === 'web',
    isDesktop:    platform === 'electron',
    isElectron:   platform === 'electron',
    hasHover:     platform === 'web' || platform === 'electron',
    hasNativeFS:  platform === 'electron',
  };
};
