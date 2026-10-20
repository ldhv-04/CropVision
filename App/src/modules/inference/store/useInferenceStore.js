/**
 * useInferenceStore — Inference Module Core State Store.
 * Decomposed store conforming to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import { create } from 'zustand';
import { API_ORIGIN } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';
import {
  getInferenceDebugRun,
  registerInferenceRunAttempt,
  startInferenceDebugRun,
} from '../debug/inferenceDebug';
import {
  normalizeCoordinates,
  getNowMs,
  logInferenceTiming,
  buildImageFormData,
} from './inferenceHelpers';

const INITIAL_STATE = {
  selectedAsset: null,
  imageUri: null,
  imageMetadata: { width: 0, height: 0 },
  imageName: null,
  detections: null,
  resultImageBase64: null,
  sampleId: null,
  isAnalyzing: false,
  hoveredDetectionIndex: null,
  selectedDetectionIndex: null,
  activeDiseaseFilter: 'all',
  focusMode: 'all',
  previewFrame: { width: 0, height: 0 },
  error: null,
  debugRunId: null,
};

const useInferenceStore = create((set, get) => ({
  ...INITIAL_STATE,

  setSelectedAsset: (asset, debugMeta = {}) => {
    if (!asset) {
      set({ selectedAsset: null, imageUri: null, imageName: null, error: null });
      return;
    }
    const uri = asset.uri || asset.path || null;
    const width = asset.width || 0;
    const height = asset.height || 0;
    const fileName = asset.fileName || (uri ? uri.split('/').pop() : null);

    set({
      selectedAsset: asset,
      imageUri: uri,
      imageMetadata: { width, height },
      imageName: fileName,
      error: null,
    });
  },

  clearResults: () => {
    set({ detections: null, resultImageBase64: null, sampleId: null, error: null });
  },

  clearDetections: () => set({ detections: null }),
  setPreviewFrame: (frame) => set({ previewFrame: frame }),
  setHovered: (index) => set({ hoveredDetectionIndex: index }),
  clearHovered: () => set({ hoveredDetectionIndex: null }),

  toggleSelected: (index) =>
    set((state) => ({
      selectedDetectionIndex: state.selectedDetectionIndex === index ? null : index,
      hoveredDetectionIndex: state.selectedDetectionIndex === index ? null : index,
    })),

  setActiveDiseaseFilter: (filter) => set({ activeDiseaseFilter: filter }),
  setDiseaseFilter: (filter) => set({ activeDiseaseFilter: filter }),
  setFocusMode: (mode) => set({ focusMode: mode }),
  setSelectedDetectionIndex: (idx) => set({ selectedDetectionIndex: idx }),
  clearSelection: () => set({ selectedDetectionIndex: null, hoveredDetectionIndex: null }),
  clearError: () => set({ error: null }),

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
    registerInferenceRunAttempt({
      runId: activeDebugRunId,
      asset: selectedAsset,
      fieldId,
      source: debugMeta.source || 'runInference',
    });

    const totalStart = getNowMs();
    set({ isAnalyzing: true, error: null, debugRunId: activeDebugRunId });

    try {
      const formData = await buildImageFormData(selectedAsset);
      if (fieldId) formData.append('field_id', fieldId);

      const coordsNorm = normalizeCoordinates(fieldCoords);
      if (coordsNorm) {
        formData.append('latitude', String(coordsNorm.latitude));
        formData.append('longitude', String(coordsNorm.longitude));
      }

      const headers = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_ORIGIN}${ENDPOINTS.inference.predict}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        set({
          detections: data.detections || [],
          resultImageBase64: data.annotated_image || null,
          sampleId: data.sample_id || null,
          isAnalyzing: false,
        });
      } else {
        set({ error: data.message || 'Inference failed', isAnalyzing: false });
      }
    } catch (err) {
      set({
        error: err.message || 'Network error during inference',
        isAnalyzing: false,
      });
    } finally {
      logInferenceTiming('runInference-completed', { totalMs: getNowMs() - totalStart });
    }
  },

  reset: () => set({ ...INITIAL_STATE }),
}));

export { useInferenceStore };
export default useInferenceStore;
