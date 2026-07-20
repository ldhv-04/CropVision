import { Platform } from 'react-native';

export function getRuntimePlatform({
  platformOS = Platform.OS,
  electronAPI = typeof window === 'undefined' ? null : window.electronAPI,
} = {}) {
  if (platformOS === 'ios' || platformOS === 'android') return platformOS;
  if (platformOS === 'web') return electronAPI?.platform === 'electron' ? 'electron' : 'web';
  return 'unknown';
}
