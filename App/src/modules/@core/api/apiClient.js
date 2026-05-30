/**
 * API Client — Layer 1 Core
 *
 * Central fetch wrapper with automatic JWT injection.
 * NO platform-specific imports. Pure JS.
 *
 * All API calls in the app should go through this client.
 */

import { Platform } from 'react-native';

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
// Origin resolution (ported from legacy api.js)
// ─────────────────────────────────────────────

const MANUAL_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN?.trim();
const API_PROTOCOL  = process.env.EXPO_PUBLIC_API_PROTOCOL || 'http';
const API_PORT      = process.env.EXPO_PUBLIC_API_PORT || '3000';

const isElectronRenderer = () =>
  Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  /electron/i.test(navigator.userAgent || '');

const resolveHost = () => {
  const manual = process.env.EXPO_PUBLIC_API_HOST?.trim();
  if (manual) return manual;
  if (isElectronRenderer()) return '127.0.0.1';
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  if (Platform.OS === 'android') return '10.0.2.2';
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

  const activeToken = token || getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...(options.headers || {}),
  };

  // When sending FormData, remove Content-Type so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // [H1] Always parse JSON first so callers get the body even on errors.
  const data = await response.json();

  // [H1] If the server returned a non-2xx status, throw an error that
  //       includes both the status code and the server's message.
  //       This lets callers (e.g. stores) distinguish network errors
  //       from server-side validation failures.
  if (!response.ok) {
    const err = new Error(data.message || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

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
