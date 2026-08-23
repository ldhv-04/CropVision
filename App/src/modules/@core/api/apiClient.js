/**
 * API Client — Layer 1 Core
 *
 * Central fetch wrapper with automatic JWT injection and smart host resolution.
 * Automatically resolves development machine IP for physical Android/iOS devices,
 * Android emulators, Web, and Electron.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically get token to avoid circular import issue with useAuthStore
const getAuthToken = () => {
  try {
    const { useAuthStore } = require('../auth/useAuthStore');
    return useAuthStore.getState().token;
  } catch (e) {
    return null;
  }
};

// ─────────────────────────────────────────────
// Origin resolution
// ─────────────────────────────────────────────

const MANUAL_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN?.trim();
const API_PROTOCOL  = process.env.EXPO_PUBLIC_API_PROTOCOL || 'http';
const API_PORT      = process.env.EXPO_PUBLIC_API_PORT || '3000';

const isElectronRenderer = () =>
  Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  /electron/i.test(navigator.userAgent || '');

const getExpoHost = () => {
  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants?.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch (e) {
    // Ignore fallback errors
  }
  return null;
};

const resolveHost = () => {
  const manual = process.env.EXPO_PUBLIC_API_HOST?.trim();

  // 1. If explicit specific IP/domain is specified (e.g. 192.168.1.15 or api.cropvision.vn)
  if (manual && manual !== '127.0.0.1' && manual !== 'localhost') {
    return manual;
  }

  // 2. Electron renderer (running on desktop)
  if (isElectronRenderer()) return '127.0.0.1';

  // 3. Web browser environment
  if (Platform.OS === 'web') {
    if (manual) return manual;
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname;
    }
    return '127.0.0.1';
  }

  // 4. Mobile (Android/iOS) via Expo Metro host IP (Works for real phones on Wi-Fi & emulators)
  const expoHost = getExpoHost();
  if (expoHost) return expoHost;

  // 5. Android Emulator loopback fallback (10.0.2.2 maps to host PC 127.0.0.1)
  if (Platform.OS === 'android') return '10.0.2.2';

  // 6. Default fallback
  return '127.0.0.1';
};

export const API_ORIGIN =
  MANUAL_ORIGIN?.replace(/\/+$/, '') ||
  `${API_PROTOCOL}://${resolveHost()}:${API_PORT}`;

// ─────────────────────────────────────────────
// URL builders
// ─────────────────────────────────────────────

export const buildUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

export const resolveAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `${API_ORIGIN}${path}`;
};

// ─────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────

/**
 * Performs a fetch request with automatic auth header injection.
 *
 * @param {string} path - API path e.g. '/api/auth/login'
 * @param {RequestInit} options - Standard fetch options
 * @param {string | null} token - JWT token (injected automatically if provided)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} If network fails or response is not ok
 */
export const apiRequest = async (path, options = {}, token = null) => {
  const url = buildUrl(path);
  const { debugRun, ...fetchOptions } = options;

  const activeToken = token || getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...(debugRun?.runId ? { 'X-Inference-Debug-Run-Id': debugRun.runId } : {}),
    ...(fetchOptions.headers || {}),
  };

  // When sending FormData, remove Content-Type so browser/engine sets multipart boundary
  if (fetchOptions.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  debugRun?.mark?.('upload-start', {
    path,
    apiOrigin: API_ORIGIN,
    method: fetchOptions.method || 'GET',
    hasFormData: fetchOptions.body instanceof FormData,
  });

  const uploadStartedAt = getNowMs();
  let response;

  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (networkErr) {
    console.error(`[API Client] Network failure calling ${url}:`, networkErr?.message || networkErr);

    const isNetworkFailed = networkErr?.name === 'TypeError' || String(networkErr?.message).includes('Network request failed');
    if (isNetworkFailed) {
      const helpfulError = new Error(`Không thể kết nối đến máy chủ (${API_ORIGIN}). Vui lòng đảm bảo backend đang chạy trên cổng ${API_PORT} và thiết bị cùng mạng Wi-Fi.`);
      helpfulError.originalError = networkErr;
      helpfulError.url = url;
      throw helpfulError;
    }
    throw networkErr;
  }

  debugRun?.mark?.('upload-done', {
    durationMs: getNowMs() - uploadStartedAt,
    status: response.status,
    ok: response.ok,
  });

  debugRun?.mark?.('response-parse-start', {
    status: response.status,
  });
  const parseStartedAt = getNowMs();
  
  let data;
  try {
    data = await response.json();
  } catch (jsonErr) {
    const parseError = new Error(`Phản hồi máy chủ không hợp lệ (HTTP ${response.status})`);
    parseError.status = response.status;
    throw parseError;
  }

  debugRun?.mark?.('response-parse-done', {
    durationMs: getNowMs() - parseStartedAt,
    success: Boolean(data?.success),
    hasData: Boolean(data?.data),
  });

  if (!response.ok) {
    const err = new Error(data?.message || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

// Default api helper object containing convenience methods
const api = {
  get: (path, options = {}, token = null) =>
    apiRequest(path, { ...options, method: 'GET' }, token),
  post: (path, body, options = {}, token = null) => {
    const isFormData = body instanceof FormData;
    return apiRequest(
      path,
      {
        ...options,
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body),
      },
      token
    );
  },
  put: (path, body, options = {}, token = null) => {
    const isFormData = body instanceof FormData;
    return apiRequest(
      path,
      {
        ...options,
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body),
      },
      token
    );
  },
  delete: (path, options = {}, token = null) =>
    apiRequest(path, { ...options, method: 'DELETE' }, token),
  patch: (path, body, options = {}, token = null) => {
    const isFormData = body instanceof FormData;
    return apiRequest(
      path,
      {
        ...options,
        method: 'PATCH',
        body: isFormData ? body : JSON.stringify(body),
      },
      token
    );
  },
};

export default api;
