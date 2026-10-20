/**
 * Helper functions and telemetry timing for Inference Store.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import { Platform } from 'react-native';

export const GPS_TIMEOUT_MS = Platform.OS === 'web' ? 5000 : 2000;

export function normalizeCoordinates(coords) {
  if (!coords) return null;
  const latitude = Array.isArray(coords) ? coords[0] : (coords.latitude ?? coords.lat);
  const longitude = Array.isArray(coords) ? coords[1] : (coords.longitude ?? coords.lng ?? coords.lon);
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

export function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function isDevRuntime() {
  if (typeof __DEV__ !== 'undefined') return Boolean(__DEV__);
  return process.env.NODE_ENV !== 'production';
}

export function logInferenceTiming(label, metrics) {
  if (!isDevRuntime()) return;
  const rounded = Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [
      key,
      typeof value === 'number' ? Math.round(value) : value,
    ])
  );
  console.info(`[InferenceTiming] ${label}`, rounded);
}

export function getFormDataStrategy(asset) {
  if (Platform.OS === 'web' && asset?.file) return 'web-file';
  if (Platform.OS === 'web' || asset?.uri?.startsWith('data:')) return 'blob-from-uri';
  return 'native-uri';
}

export async function buildImageFormData(asset) {
  const uriParts = asset.uri.split('/');
  const rawFileName = uriParts[uriParts.length - 1] || `sample-${Date.now()}.jpg`;
  const fileName = (asset.fileName || rawFileName).includes('.')
    ? (asset.fileName || rawFileName)
    : `${rawFileName}.jpg`;

  const formData = new FormData();

  if (Platform.OS === 'web' && asset.file) {
    formData.append('image', asset.file, fileName);
  } else if (Platform.OS === 'web' || asset.uri?.startsWith('data:')) {
    const resp = await fetch(asset.uri);
    const blob = await resp.blob();
    formData.append('image', blob, fileName);
  } else {
    formData.append('image', {
      uri: asset.uri,
      name: fileName,
      type: asset.mimeType || 'image/jpeg',
    });
  }

  return formData;
}
