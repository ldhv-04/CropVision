/**
 * useInferenceStore — Inference Module / Layer 1: Core
 *
 * Zustand store replacing ~15 useState calls in the old MainDashBoard.
 * All YOLO inference state lives here — components subscribe to
 * only the slices they need, preventing cascading re-renders.
 *
 * NO platform-specific imports. Pure JS.
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import { API_ORIGIN, apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';
import {
  getInferenceDebugRun,
  registerInferenceRunAttempt,
  sanitizeImageAsset,
  startInferenceDebugRun,
} from '../debug/inferenceDebug';

// Lazy import expo-location — only available in native/Expo context
let Location;
try {
  Location = require('expo-location');
} catch {
  Location = null;
}

const GPS_TIMEOUT_MS = Platform.OS === 'web' ? 5000 : 2000;

const useInferenceStore = create((set, get) => ({
  // ─── Image selection state ─────────────────────────────────────────────
  selectedAsset:     null,   // Full asset from image picker
  imageUri:          null,   // URI for preview rendering
  imageMetadata:     { width: 0, height: 0 },  // Original image dimensions
  imageName:         null,   // Original filename from server (for display)

  // ─── Inference results ─────────────────────────────────────────────────
  detections:        null,   // Array of YOLO boxes or null if not run yet
  resultImageBase64: null,   // Base64 annotated image from AI core
  sampleId:          null,   // Database sample ID (for linking to chat consultation)

  // ─── UI interaction state ──────────────────────────────────────────────
  isAnalyzing:          false,
  hoveredDetectionIndex:  null,
  selectedDetectionIndex: null,
  activeDiseaseFilter:  'all',
  focusMode:            'all',  // 'all' | 'selected'
  previewFrame:         { width: 0, height: 0 },  // Layout-measured container size

  // ─── Status ────────────────────────────────────────────────────────────
  error: null,
  debugRunId: null,

  // ─── Actions ───────────────────────────────────────────────────────────

  /** Called when user picks an image (native or web). */
  setSelectedAsset: (asset, debugMeta = {}) => {
    const imageSource = debugMeta.imageSource || 'store';
    const debugRun = asset
      ? startInferenceDebugRun({
          source: debugMeta.source || 'setSelectedAsset',
          imageSource,
          asset,
          fieldId: debugMeta.fieldId || null,
        })
      : null;

    if (debugRun) {
      debugRun.mark(imageSource === 'camera' ? 'camera-captured' : 'image-selected', {
        screen: debugMeta.source || 'setSelectedAsset',
        imageSource,
        asset,
      });
    }

    set({
      selectedAsset:          asset,
      imageUri:               asset?.uri ?? null,
      imageName:              asset?.fileName || null,
      detections:             null,
      resultImageBase64:      null,
      hoveredDetectionIndex:  null,
      selectedDetectionIndex: null,
      activeDiseaseFilter:    'all',
      focusMode:              'all',
      error:                  null,
      debugRunId:             debugRun?.runId || null,
    });
  },

  /** Called when the image container lays out on screen. */
  setPreviewFrame: (frame) => set({ previewFrame: frame }),

  /**
   * [M2] Build a FormData with the selected image for upload.
   *
   * Platform strategy (3 cases, simplified):
   *   1. Web with File object  → use it directly (best quality, preserves metadata)
   *   2. Web with data: URI    → convert to Blob via fetch()
   *   3. Native (iOS/Android)  → pass {uri, name, type} object (RN polyfill handles it)
   *
   * @param {object} asset - The selected asset from image picker
   * @returns {Promise<FormData>} Ready-to-send FormData with 'image' field
   */
  _buildImageFormData: async (asset) => {
    const uriParts    = asset.uri.split('/');
    const rawFileName = uriParts[uriParts.length - 1] || `sample-${Date.now()}.jpg`;
    const fileName    = (asset.fileName || rawFileName).includes('.')
      ? (asset.fileName || rawFileName)
      : `${rawFileName}.jpg`;

    const formData = new FormData();

    if (Platform.OS === 'web' && asset.file) {
      // Case 1: Web — File object from <input type="file"> or dropzone
      formData.append('image', asset.file, fileName);
    } else if (Platform.OS === 'web' || asset.uri?.startsWith('data:')) {
      // Case 2: Web — data: URI or blob URL, convert to Blob first
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      formData.append('image', blob, fileName);
    } else {
      // Case 3: Native — React Native's FormData accepts {uri, name, type}
      formData.append('image', {
        uri:  asset.uri,
        name: fileName,
        type: asset.mimeType || 'image/jpeg',
      });
    }

    return formData;
  },

  /**
   * Capture device GPS coordinates. Returns [lat, lon] or null.
   * Gracefully handles web (navigator.geolocation), native (expo-location), and failures.
   */
  _captureGPS: async ({ debugRun = null, timeoutMs = GPS_TIMEOUT_MS } = {}) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        debugRun?.mark('context-location-permission-start', {
          platform: Platform.OS,
        });
        debugRun?.mark('context-location-permission-done', {
          platform: Platform.OS,
          permissionStatus: 'browser-managed',
        });
        return await captureWebGPS({ debugRun, timeoutMs });
      }

      if (Location) {
        const permissionStart = getNowMs();
        debugRun?.mark('context-location-permission-start', {
          platform: Platform.OS,
        });
        const { status } = await Location.requestForegroundPermissionsAsync();
        debugRun?.mark('context-location-permission-done', {
          durationMs: getNowMs() - permissionStart,
          permissionStatus: status,
        });
        if (status !== 'granted') {
          debugRun?.mark('context-location-skipped', {
            reason: 'permission-not-granted',
            permissionStatus: status,
            requestedDeviceGps: true,
          });
          return null;
        }

        const locationStart = getNowMs();
        debugRun?.mark('context-location-start', {
          accuracy: 'Balanced',
          timeoutMs,
        });
        const result = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
            .then((loc) => ({ loc }))
            .catch((error) => ({ error })),
          delay(timeoutMs).then(() => ({ timedOut: true })),
        ]);

        const durationMs = getNowMs() - locationStart;
        if (result.timedOut) {
          debugRun?.mark('context-location-timeout', {
            durationMs,
            timeoutMs,
          });
          debugRun?.mark('context-location-done', {
            durationMs,
            hasLocation: false,
            reason: 'timeout',
          });
          return null;
        }
        if (result.error) throw result.error;

        const loc = result.loc;
        debugRun?.mark('context-location-done', {
          durationMs,
          hasLocation: Boolean(loc?.coords),
        });
        return [loc.coords.latitude, loc.coords.longitude];
      }

      debugRun?.mark('context-location-skipped', {
        reason: 'location-api-unavailable',
        requestedDeviceGps: false,
      });
    } catch (e) {
      console.warn('[GPS] Could not capture location:', e.message);
      debugRun?.mark('context-location-done', {
        hasLocation: false,
        reason: 'error',
        message: e?.message,
      });
    }
    return null;
  },

  /** Run YOLO inference via the backend API.
   *  @param {string} token - JWT auth token
   *  @param {string|null} [fieldId] - Optional field ID for weather+crop context injection
   *  @param {object|null} [fieldCoords] - Optional {latitude, longitude} from selected field
   */
  runInference: async (token, fieldId = null, fieldCoords = null, debugMeta = {}) => {
    const { selectedAsset, debugRunId } = get();
    if (!selectedAsset?.uri) return;

    const debugRun = debugRunId
      ? getInferenceDebugRun(debugRunId)
      : startInferenceDebugRun({
          source: debugMeta.source || 'runInference',
          imageSource: debugMeta.imageSource || 'store',
          asset: selectedAsset,
          fieldId,
        });
    const activeDebugRunId = debugRun.runId || debugRunId || null;
    const duplicate = registerInferenceRunAttempt({
      runId: activeDebugRunId,
      asset: selectedAsset,
      fieldId,
      source: debugMeta.source || 'runInference',
    });

    const totalStart = getNowMs();
    debugRun.mark('inference-run-requested', {
      screen: debugMeta.source || 'runInference',
      trigger: debugMeta.trigger || 'manual',
      fieldId,
      apiOrigin: API_ORIGIN,
      asset: selectedAsset,
    });
    debugRun.mark('duplicate-guard-check', {
      duplicateCount: duplicate.duplicateCount,
      hasSelectedAsset: Boolean(selectedAsset?.uri),
      hasDetections: Boolean(get().detections?.length),
      isAnalyzing: Boolean(get().isAnalyzing),
    });
    set({ isAnalyzing: true, error: null, debugRunId: activeDebugRunId });

    try {
      // [M2] Delegate FormData construction to helper (reduces cognitive load here)
      const prepStart = getNowMs();
      debugRun.mark('formdata-start', {
        asset: selectedAsset,
        formDataStrategy: getFormDataStrategy(selectedAsset),
      });
      const formData = await get()._buildImageFormData(selectedAsset);
      const imagePrepMs = getNowMs() - prepStart;
      debugRun.mark('formdata-done', {
        durationMs: imagePrepMs,
        image: sanitizeImageAsset(selectedAsset, debugMeta.imageSource || 'store'),
      });

      // [GPS] Capture location — prefer field coords, fallback to device GPS
      const contextStart = getNowMs();
      debugRun.mark('context-start', {
        hasFieldId: Boolean(fieldId),
        hasFieldCoords: Boolean(fieldCoords),
      });

      const fieldContextStart = getNowMs();
      debugRun.mark('context-field-start', {
        hasFieldId: Boolean(fieldId),
        hasFieldCoords: Boolean(fieldCoords),
      });
      if (fieldId) formData.append('field_id', fieldId);
      const fieldCoordsNormalized = normalizeCoordinates(fieldCoords);
      debugRun.mark('context-field-done', {
        durationMs: getNowMs() - fieldContextStart,
        hasFieldId: Boolean(fieldId),
        hasFieldCoords: Boolean(fieldCoordsNormalized),
      });

      const weatherContextStart = getNowMs();
      debugRun.mark('context-weather-start', {
        requested: false,
      });
      debugRun.mark('context-weather-done', {
        durationMs: getNowMs() - weatherContextStart,
        requested: false,
        reason: 'not-collected-in-inference-context',
      });

      const assetCoords = normalizeCoordinates(
        selectedAsset?.location ||
        selectedAsset?.gps ||
        selectedAsset?.coords ||
        selectedAsset
      );
      let coords = fieldCoordsNormalized || assetCoords;
      let locationSource = fieldCoordsNormalized ? 'field' : assetCoords ? 'asset' : 'none';
      if (coords) {
        debugRun.mark('context-location-skipped', {
          reason: `${locationSource}-coordinates-present`,
          hasLocation: true,
          requestedDeviceGps: false,
        });
      } else {
        coords = normalizeCoordinates(await get()._captureGPS({ debugRun }));
        locationSource = coords ? 'device' : 'none';
      }
      if (coords) {
        formData.append('latitude', String(coords[0]));
        formData.append('longitude', String(coords[1]));
      }
      const contextMs = getNowMs() - contextStart;
      debugRun.mark('context-finalized', {
        durationMs: contextMs,
        hasLocation: Boolean(coords),
        locationSource,
        requestedDeviceGps: !fieldCoordsNormalized && !assetCoords,
        timeoutMs: GPS_TIMEOUT_MS,
      });
      debugRun.mark('context-done', {
        durationMs: contextMs,
        hasLocation: Boolean(coords),
        locationSource,
      });

      const uploadStart = getNowMs();
      const data = await apiRequest(ENDPOINTS.inference.analyze, {
        method: 'POST',
        body:   formData,
        debugRun,
      }, token);
      const uploadMs = getNowMs() - uploadStart;

      if (data.success) {
        set({
          detections:             data.data.boxes,
          resultImageBase64:      data.data.image_base64,
          imageMetadata:          { width: data.data.image_width || 0, height: data.data.image_height || 0 },
          imageName:              data.data.image_name || get().imageName,
          sampleId:               data.data.sample_id || null,  // Store sample ID for chat consultation
          hoveredDetectionIndex:  null,
          selectedDetectionIndex: null,
          activeDiseaseFilter:    'all',
          focusMode:              'all',
          isAnalyzing:            false,
        });
        debugRun.mark('store-update-done', {
          boxes: data.data?.boxes?.length ?? 0,
          hasBase64: Boolean(data.data?.image_base64),
          imageWidth: data.data?.image_width || 0,
          imageHeight: data.data?.image_height || 0,
          sampleId: data.data?.sample_id || null,
        });
        debugRun.print();
        logInferenceTiming('client-runInference', {
          imagePrepMs,
          contextMs,
          uploadMs,
          totalMs: getNowMs() - totalStart,
          boxes: data.data?.boxes?.length ?? 0,
          hasFieldContext: Boolean(fieldId),
        });
      } else {
        set({ error: data.message, isAnalyzing: false });
        debugRun.mark('store-update-done', {
          success: false,
          message: data.message,
        });
        debugRun.print();
        logInferenceTiming('client-runInference-unsuccessful', {
          imagePrepMs,
          contextMs,
          uploadMs,
          totalMs: getNowMs() - totalStart,
        });
      }
    } catch (err) {
      set({
        error: 'Không thể kết nối đến máy chủ. Hãy chắc chắn backend và AI Core đang chạy.',
        isAnalyzing: false,
      });
      debugRun.error('inference-error', err, {
        screen: debugMeta.source || 'runInference',
        totalMs: getNowMs() - totalStart,
      });
      debugRun.print();
      logInferenceTiming('client-runInference-error', {
        totalMs: getNowMs() - totalStart,
        message: err?.message,
      });
    }
  },

  // ─── Interaction actions ────────────────────────────────────────────────

  setPreviewFrame:   (frame)  => set({ previewFrame: frame }),
  setHovered:        (index)  => set({ hoveredDetectionIndex: index }),
  clearHovered:      ()       => set({ hoveredDetectionIndex: null }),

  toggleSelected: (index) => set((state) => {
    const next = state.selectedDetectionIndex === index ? null : index;
    return {
      selectedDetectionIndex: next,
      hoveredDetectionIndex:  next,
      // Auto-clear filter mismatch when selecting
      activeDiseaseFilter:
        next !== null &&
        state.activeDiseaseFilter !== 'all' &&
        state.detections?.[next]?.class_name !== state.activeDiseaseFilter
          ? state.detections?.[next]?.class_name ?? state.activeDiseaseFilter
          : state.activeDiseaseFilter,
    };
  }),

  setDiseaseFilter: (filter) => set({ activeDiseaseFilter: filter }),
  setFocusMode:     (mode)   => set({ focusMode: mode }),
  clearSelection:   ()       => set({ selectedDetectionIndex: null, hoveredDetectionIndex: null }),
  clearError:       ()       => set({ error: null }),
}));

function normalizeCoordinates(coords) {
  if (!coords) return null;

  const latitude = Array.isArray(coords)
    ? coords[0]
    : coords.latitude ?? coords.lat;
  const longitude = Array.isArray(coords)
    ? coords[1]
    : coords.longitude ?? coords.lng ?? coords.lon;

  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return [lat, lon];
}

async function captureWebGPS({ debugRun, timeoutMs }) {
  const locationStart = getNowMs();
  debugRun?.mark('context-location-start', {
    accuracy: 'browser-default',
    timeoutMs,
  });

  const result = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        coords: [pos.coords.latitude, pos.coords.longitude],
      }),
      (error) => resolve({
        error,
        timedOut: error?.code === error?.TIMEOUT,
      }),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 30000 }
    );
  });

  const durationMs = getNowMs() - locationStart;
  if (result.timedOut) {
    debugRun?.mark('context-location-timeout', {
      durationMs,
      timeoutMs,
    });
  }

  debugRun?.mark('context-location-done', {
    durationMs,
    hasLocation: Boolean(result.coords),
    reason: result.error ? (result.timedOut ? 'timeout' : 'error') : undefined,
  });
  return result.coords || null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFormDataStrategy(asset) {
  if (Platform.OS === 'web' && asset?.file) return 'web-file';
  if (Platform.OS === 'web' || asset?.uri?.startsWith('data:')) return 'blob-from-uri';
  return 'native-uri';
}

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function isDevRuntime() {
  if (typeof __DEV__ !== 'undefined') return Boolean(__DEV__);
  return process.env.NODE_ENV !== 'production';
}

function logInferenceTiming(label, metrics) {
  if (!isDevRuntime()) return;
  const rounded = Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [
      key,
      typeof value === 'number' ? Math.round(value) : value,
    ])
  );
  console.info(`[InferenceTiming] ${label}`, rounded);
}

export { useInferenceStore };
