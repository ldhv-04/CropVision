import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { API_ORIGIN } from '../../@core/api/apiClient';

const MAX_EVENTS = 120;
const listeners = new Set();
const runs = new Map();
let latestRunId = null;

export function isInferenceDebugEnabled() {
  const isDev = typeof __DEV__ !== 'undefined'
    ? Boolean(__DEV__)
    : process.env.NODE_ENV !== 'production';
  return isDev && process.env.EXPO_PUBLIC_INFERENCE_DEBUG === '1';
}

export function startInferenceDebugRun(input = {}) {
  if (!isInferenceDebugEnabled()) return createNoopRun();

  const runId = input.runId || createRunId();
  const startedAt = getNowMs();
  const run = {
    runId,
    startedAt,
    source: input.source || 'unknown',
    imageSource: input.imageSource || 'unknown',
    fieldId: input.fieldId || null,
    currentPhase: 'started',
    duplicateCount: 0,
    lastError: null,
    metrics: {},
    image: sanitizeImageAsset(input.asset, input.imageSource),
    events: [],
  };

  runs.set(runId, run);
  latestRunId = runId;

  mark(runId, 'debug-run-started', {
    source: run.source,
    imageSource: run.imageSource,
    fieldId: run.fieldId,
    image: run.image,
    apiOrigin: API_ORIGIN,
    platform: Platform.OS,
  });

  return createRunHandle(runId);
}

export function getInferenceDebugRun(runId) {
  if (!isInferenceDebugEnabled() || !runId || !runs.has(runId)) return createNoopRun();
  return createRunHandle(runId);
}

export function getLatestInferenceDebugRunId() {
  return latestRunId;
}

export function registerInferenceRunAttempt({ runId, asset, fieldId, source }) {
  if (!isInferenceDebugEnabled()) {
    return { duplicateCount: 0, duplicateKeyHash: null };
  }

  const duplicateKey = [
    source || 'unknown',
    fieldId || 'no-field',
    asset?.assetId || asset?.id || asset?.fileName || asset?.filename || '',
    asset?.creationTime || asset?.modificationTime || '',
    asset?.uri || '',
  ].join('|');
  const duplicateKeyHash = hashString(duplicateKey);
  let count = 0;

  for (const run of runs.values()) {
    if (run.metrics.duplicateKeyHash === duplicateKeyHash) count += 1;
  }

  const run = runs.get(runId);
  if (run) {
    run.metrics.duplicateKeyHash = duplicateKeyHash;
    run.duplicateCount = count + 1;
    notify();
  }

  if (count + 1 > 1) {
    console.warn(`[InferenceDebug][${runId}][duplicate] same image/context run count=${count + 1}`, {
      duplicateKeyHash,
      source,
      fieldId,
    });
  }

  return { duplicateCount: count + 1, duplicateKeyHash };
}

export function markInferenceDebugEvent(runId, event, metadata = {}) {
  if (!isInferenceDebugEnabled() || !runId) return;
  mark(runId, event, metadata);
}

export function markLatestInferenceDebugEvent(event, metadata = {}) {
  if (!latestRunId) return;
  markInferenceDebugEvent(latestRunId, event, metadata);
}

export function errorInferenceDebugEvent(runId, event, error, metadata = {}) {
  if (!isInferenceDebugEnabled() || !runId) return;
  const run = runs.get(runId);
  if (run) {
    run.lastError = sanitizeError(error);
  }
  mark(runId, event, { ...metadata, error: sanitizeError(error) });
}

export function useInferenceDebugSnapshot() {
  const [snapshot, setSnapshot] = useState(() => buildSnapshot());

  useEffect(() => {
    if (!isInferenceDebugEnabled()) return undefined;
    const listener = () => setSnapshot(buildSnapshot());
    listeners.add(listener);
    listener();
    return () => listeners.delete(listener);
  }, []);

  return snapshot;
}

export function formatInferenceDebugTimeline(runId = latestRunId) {
  const run = runId ? runs.get(runId) : null;
  if (!run) return '[InferenceDebug] no active run';

  const lines = [
    `[InferenceDebug] run=${run.runId} source=${run.source} imageSource=${run.imageSource}`,
    `platform=${Platform.OS} apiOrigin=${API_ORIGIN} duplicateCount=${run.duplicateCount}`,
    `image=${JSON.stringify(run.image)}`,
  ];

  for (const event of run.events) {
    const meta = Object.keys(event.metadata || {}).length
      ? ` ${JSON.stringify(event.metadata)}`
      : '';
    lines.push(`[InferenceDebug][${run.runId}][+${event.elapsedMs}ms] ${event.event}${meta}`);
  }

  lines.push(
    `[InferenceDebug][${run.runId}][summary] totalMs=${Math.round(getNowMs() - run.startedAt)} ` +
    `uploadMs=${run.metrics['upload-done'] ?? 'n/a'} ` +
    `formDataMs=${run.metrics['formdata-done'] ?? 'n/a'} ` +
    `contextMs=${run.metrics['context-done'] ?? 'n/a'} ` +
    `parseMs=${run.metrics['response-parse-done'] ?? 'n/a'} ` +
    `duplicateCount=${run.duplicateCount || 0}`
  );

  return lines.join('\n');
}

export function printInferenceDebugTimeline(runId = latestRunId) {
  if (!isInferenceDebugEnabled()) return;
  console.info(formatInferenceDebugTimeline(runId));
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

function createRunHandle(runId) {
  return {
    runId,
    mark: (event, metadata) => markInferenceDebugEvent(runId, event, metadata),
    error: (event, error, metadata) => errorInferenceDebugEvent(runId, event, error, metadata),
    summary: () => formatInferenceDebugTimeline(runId),
    print: () => printInferenceDebugTimeline(runId),
  };
}

function createNoopRun() {
  return {
    runId: null,
    mark: () => {},
    error: () => {},
    summary: () => '',
    print: () => {},
  };
}

function mark(runId, event, metadata = {}) {
  const run = runs.get(runId);
  if (!run) return;

  const now = getNowMs();
  const sanitized = sanitizeMetadata(metadata);
  const item = {
    runId,
    timestamp: new Date().toISOString(),
    elapsedMs: Math.round(now - run.startedAt),
    event,
    source: sanitized.screen || sanitized.source || run.source,
    metadata: sanitized,
  };

  run.currentPhase = event;
  if (event.endsWith('-done') && typeof sanitized.durationMs === 'number') {
    run.metrics[event] = Math.round(sanitized.durationMs);
  }
  run.events.push(item);
  if (run.events.length > MAX_EVENTS) run.events.shift();

  console.info(`[InferenceDebug][${runId}][+${item.elapsedMs}ms] ${event}`, sanitized);
  notify();
}

function buildSnapshot() {
  const latestRun = latestRunId ? runs.get(latestRunId) : null;
  if (!latestRun) {
    return {
      enabled: isInferenceDebugEnabled(),
      runId: null,
      currentPhase: null,
      totalElapsedMs: 0,
      events: [],
      image: null,
      metrics: {},
      duplicateCount: 0,
      lastError: null,
      timeline: '[InferenceDebug] no active run',
    };
  }

  return {
    enabled: isInferenceDebugEnabled(),
    runId: latestRun.runId,
    currentPhase: latestRun.currentPhase,
    totalElapsedMs: Math.round(getNowMs() - latestRun.startedAt),
    events: latestRun.events.slice(-20),
    image: latestRun.image,
    metrics: latestRun.metrics,
    duplicateCount: latestRun.duplicateCount,
    lastError: latestRun.lastError,
    timeline: formatInferenceDebugTimeline(latestRun.runId),
  };
}

function sanitizeMetadata(metadata = {}) {
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

function sanitizeNestedObject(value) {
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

function sanitizeError(error) {
  if (!error) return null;
  return compactObject({
    name: error.name,
    message: error.message || String(error),
    status: error.status,
  });
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')
  );
}

function getUriScheme(uri) {
  if (!uri || typeof uri !== 'string') return undefined;
  const match = uri.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (match) return match[1];
  if (uri.startsWith('/')) return 'file-path';
  return 'unknown';
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : undefined;
}

function createRunId() {
  return `inf_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
}

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function hashString(value) {
  const text = String(value || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.warn('[InferenceDebug] listener failed', sanitizeError(error));
    }
  }
}
