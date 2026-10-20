import { Platform } from 'react-native';
import { API_ORIGIN } from '../../@core/api/apiClient';

export function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')
  );
}

export function getUriScheme(uri) {
  if (!uri || typeof uri !== 'string') return undefined;
  const match = uri.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (match) return match[1];
  if (uri.startsWith('/')) return 'file-path';
  return 'unknown';
}

export function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : undefined;
}

export function createRunId() {
  return `inf_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
}

export function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function hashString(value) {
  const text = String(value || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function sanitizeError(error) {
  if (!error) return null;
  return compactObject({
    name: error.name,
    message: error.message || String(error),
    status: error.status,
  });
}

export function sanitizeImageAsset(asset, imageSource = 'unknown') {
  if (!asset) {
    return {
      source: imageSource,
      platform: Platform.OS,
      apiOrigin: API_ORIGIN,
    };
  }

  const file = asset.file || null;
  return compactObject({
    source: imageSource,
    platform: Platform.OS,
    apiOrigin: API_ORIGIN,
    uriScheme: getUriScheme(asset.uri),
    uriHash: asset.uri ? hashString(asset.uri) : undefined,
    fileName: asset.fileName || asset.filename || file?.name,
    mimeType: asset.mimeType || asset.type || file?.type,
    width: toFiniteNumber(asset.width),
    height: toFiniteNumber(asset.height),
    fileSize: toFiniteNumber(asset.fileSize ?? asset.size ?? file?.size),
    assetIdHash: asset.assetId || asset.id ? hashString(asset.assetId || asset.id) : undefined,
  });
}

export function sanitizeNestedObject(value) {
  const result = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.toLowerCase().includes('token') || key.toLowerCase().includes('authorization')) {
      result[key] = '[redacted]';
    } else if (key === 'uri') {
      result.uriScheme = getUriScheme(nestedValue);
      result.uriHash = nestedValue ? hashString(String(nestedValue)) : undefined;
    } else if (typeof nestedValue === 'number') {
      result[key] = Number.isFinite(nestedValue) ? Math.round(nestedValue) : nestedValue;
    } else if (!nestedValue || typeof nestedValue !== 'object') {
      result[key] = nestedValue;
    }
  }
  return compactObject(result);
}

export function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return {};
  const result = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (lower.includes('token') || lower.includes('authorization') || lower.includes('password')) {
      result[key] = '[redacted]';
    } else if (key === 'uri') {
      result.uriScheme = getUriScheme(value);
      result.uriHash = value ? hashString(String(value)) : undefined;
    } else if (key === 'asset') {
      result.image = sanitizeImageAsset(value, metadata.imageSource);
    } else if (key === 'error') {
      result.error = sanitizeError(value);
    } else if (typeof value === 'number') {
      result[key] = Number.isFinite(value) ? Math.round(value) : value;
    } else if (Array.isArray(value)) {
      result[key] = value.slice(0, 10);
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeNestedObject(value);
    } else {
      result[key] = value;
    }
  }
  return compactObject(result);
}
