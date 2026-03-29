import { Platform } from 'react-native';

const MANUAL_API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN?.trim();
const API_PROTOCOL = process.env.EXPO_PUBLIC_API_PROTOCOL || 'http';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3000';
const DEFAULT_DESKTOP_HOST = '127.0.0.1';
const DEFAULT_ANDROID_HOST = '10.0.2.2';

const normalizeOrigin = (rawOrigin) => {
  if (!rawOrigin) {
    return null;
  }

  const trimmedOrigin = rawOrigin.trim().replace(/\/+$/, '');
  return trimmedOrigin || null;
};

const isElectronRenderer = () => {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return false;
  }

  return /electron/i.test(navigator.userAgent || '');
};

const resolveApiHost = () => {
  const manualHost = process.env.EXPO_PUBLIC_API_HOST?.trim();
  if (manualHost) {
    return manualHost;
  }

  if (isElectronRenderer()) {
    return DEFAULT_DESKTOP_HOST;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  if (Platform.OS === 'android') {
    return DEFAULT_ANDROID_HOST;
  }

  return DEFAULT_DESKTOP_HOST;
};

export const API_ORIGIN = normalizeOrigin(MANUAL_API_ORIGIN)
  || `${API_PROTOCOL}://${resolveApiHost()}:${API_PORT}`;

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

export const getApiConnectionHelp = () => {
  if (MANUAL_API_ORIGIN) {
    return `Ung dung dang dung EXPO_PUBLIC_API_ORIGIN=${API_ORIGIN}. Hay kiem tra backend co chay tai dia chi nay khong.`;
  }

  if (process.env.EXPO_PUBLIC_API_HOST?.trim()) {
    return `Ung dung dang dung EXPO_PUBLIC_API_HOST=${process.env.EXPO_PUBLIC_API_HOST.trim()}. Hay kiem tra backend co the truy cap qua host nay khong.`;
  }

  if (isElectronRenderer()) {
    return 'Electron desktop mac dinh goi backend tai http://127.0.0.1:3000. Hay chac chan backend dang chay tren cung may.';
  }

  if (Platform.OS === 'android') {
    return 'Android emulator mac dinh goi backend tai http://10.0.2.2:3000. Hay chac chan backend dang mo cong 3000.';
  }

  return 'Neu backend khong chay tren cung may, hay dat EXPO_PUBLIC_API_ORIGIN theo IP hoac domain thuc te cua backend.';
};

export const resolveAssetUrl = (path) => {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  return `${API_ORIGIN}${path}`;
};
