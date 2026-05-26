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
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

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

  // ─── Actions ───────────────────────────────────────────────────────────

  /** Called when user picks an image (native or web). */
  setSelectedAsset: (asset) => set({
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
  }),

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

  /** Run YOLO inference via the backend API.
   *  @param {string} token - JWT auth token
   *  @param {string|null} [fieldId] - Optional field ID for weather+crop context injection
   */
  runInference: async (token, fieldId = null) => {
    const { selectedAsset } = get();
    if (!selectedAsset?.uri) return;

    set({ isAnalyzing: true, error: null });

    try {
      // [M2] Delegate FormData construction to helper (reduces cognitive load here)
      const formData = await get()._buildImageFormData(selectedAsset);

      // [AgriVision] Inject field context if provided
      if (fieldId) formData.append('field_id', fieldId);

      const data = await apiRequest(ENDPOINTS.inference.analyze, {
        method: 'POST',
        body:   formData,
      }, token);

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
