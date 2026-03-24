import { NativeModules, Platform } from 'react-native';

const API_PROTOCOL = process.env.EXPO_PUBLIC_API_PROTOCOL || 'http';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3000';

const extractHostFromUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const match = rawUrl.match(/^[a-zA-Z]+:\/\/([^/:]+)/);
  return match?.[1] || null;
};

const resolveApiHost = () => {
  const manualHost = process.env.EXPO_PUBLIC_API_HOST?.trim();
  if (manualHost) {
    return manualHost;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  const metroHost = extractHostFromUrl(NativeModules.SourceCode?.scriptURL);
  if (metroHost && metroHost !== 'localhost') {
    return metroHost;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return '127.0.0.1';
};

export const API_ORIGIN = `${API_PROTOCOL}://${resolveApiHost()}:${API_PORT}`;

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
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
