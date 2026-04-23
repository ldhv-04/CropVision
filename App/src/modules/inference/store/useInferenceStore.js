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
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

const useInferenceStore = create((set, get) => ({
  // ─── Image selection state ─────────────────────────────────────────────
  selectedAsset:     null,   // Full asset from image picker
  imageUri:          null,   // URI for preview rendering
  imageMetadata:     { width: 0, height: 0 },  // Original image dimensions

  // ─── Inference results ─────────────────────────────────────────────────
  detections:        null,   // Array of YOLO boxes or null if not run yet
  resultImageBase64: null,   // Base64 annotated image from AI core

  // ─── UI interaction state ──────────────────────────────────────────────
  isAnalyzing:          false,
  hoveredDetectionIndex:  null,
  selectedDetectionIndex: null,
  activeDiseaseFilter:  'all',
  focusMode:            'all',  // 'all' | 'selected'
  previewFrame:         { width: 0, height: 0 },  // Layout-measured container size

  // ─── Status ────────────────────────────────────────────────────────────
  error: null,

  // ─── Actions ───────────────────────────────────────────────────────────

  /** Called when user picks an image (native or web). */
  setSelectedAsset: (asset) => set({
    selectedAsset:          asset,
    imageUri:               asset?.uri ?? null,
    detections:             null,
    resultImageBase64:      null,
    hoveredDetectionIndex:  null,
    selectedDetectionIndex: null,
    activeDiseaseFilter:    'all',
    focusMode:              'all',
    error:                  null,
  }),

  /** Called when the image container lays out on screen. */
  setPreviewFrame: (frame) => set({ previewFrame: frame }),

  /** Run YOLO inference via the backend API. */
  runInference: async (token) => {
    const { selectedAsset } = get();
    if (!selectedAsset?.uri) return;

    set({ isAnalyzing: true, error: null });

    try {
      const uriParts    = selectedAsset.uri.split('/');
      const rawFileName = uriParts[uriParts.length - 1] || `sample-${Date.now()}.jpg`;
      const fileName    = (selectedAsset.fileName || rawFileName).includes('.')
        ? (selectedAsset.fileName || rawFileName)
        : `${rawFileName}.jpg`;

      const formData = new FormData();

      // Platform-aware FormData append — handled by the caller via ImagePickerService
      // The store receives a ready formData or builds it here generically
      if (typeof window !== 'undefined' && selectedAsset.file) {
        // Web: file object available directly
        formData.append('image', selectedAsset.file, fileName);
      } else if (selectedAsset.uri?.startsWith('data:') || typeof window !== 'undefined') {
        // Web blob fallback
        const resp = await fetch(selectedAsset.uri);
        const blob = await resp.blob();
        formData.append('image', blob, fileName);
      } else {
        // Native
        formData.append('image', {
          uri:  selectedAsset.uri,
          name: fileName,
          type: selectedAsset.mimeType || 'image/jpeg',
        });
      }

      const data = await apiRequest(ENDPOINTS.inference.analyze, {
        method: 'POST',
        body:   formData,
      }, token);

      if (data.success) {
        set({
          detections:             data.data.boxes,
          resultImageBase64:      data.data.image_base64,
          imageMetadata:          { width: data.data.image_width || 0, height: data.data.image_height || 0 },
          hoveredDetectionIndex:  null,
          selectedDetectionIndex: null,
          activeDiseaseFilter:    'all',
          focusMode:              'all',
          isAnalyzing:            false,
        });
      } else {
        set({ error: data.message, isAnalyzing: false });
      }
    } catch (err) {
      set({
        error: 'Không thể kết nối đến máy chủ. Hãy chắc chắn backend và AI Core đang chạy.',
        isAnalyzing: false,
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

export { useInferenceStore };
