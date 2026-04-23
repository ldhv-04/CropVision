/**
 * API Client — Layer 1 Core
 *
 * Central fetch wrapper with automatic JWT injection.
 * NO platform-specific imports. Pure JS.
 *
 * All API calls in the app should go through this client.
 */

import { Platform } from 'react-native';

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

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  const data = await response.json();
  return data;
};
