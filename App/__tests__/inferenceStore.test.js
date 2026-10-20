import { useInferenceStore } from '../src/modules/inference/store/useInferenceStore';

describe('Inference Store State Machine Tests (US2)', () => {
  beforeEach(() => {
    useInferenceStore.getState().reset();
  });

  test('Initializes with default empty state', () => {
    const state = useInferenceStore.getState();
    expect(state.selectedAsset).toBeNull();
    expect(state.imageUri).toBeNull();
    expect(state.detections).toBeNull();
    expect(state.isAnalyzing).toBe(false);
    expect(state.activeDiseaseFilter).toBe('all');
  });

  test('Sets selected asset and extracts uri and metadata', () => {
    const mockAsset = {
      uri: 'file:///data/crop_leaf_01.jpg',
      width: 1080,
      height: 1920,
      fileName: 'crop_leaf_01.jpg',
    };

    useInferenceStore.getState().setSelectedAsset(mockAsset);
    const state = useInferenceStore.getState();
    expect(state.imageUri).toBe('file:///data/crop_leaf_01.jpg');
    expect(state.imageMetadata.width).toBe(1080);
    expect(state.imageName).toBe('crop_leaf_01.jpg');
  });

  test('Manages active disease filter and focus mode transitions', () => {
    useInferenceStore.getState().setActiveDiseaseFilter('Blast');
    expect(useInferenceStore.getState().activeDiseaseFilter).toBe('Blast');

    useInferenceStore.getState().setFocusMode('selected');
    expect(useInferenceStore.getState().focusMode).toBe('selected');

    useInferenceStore.getState().setSelectedDetectionIndex(2);
    expect(useInferenceStore.getState().selectedDetectionIndex).toBe(2);
  });

  test('Reset clears all image and inference state', () => {
    useInferenceStore.setState({
      imageUri: 'file:///test.jpg',
      detections: [{ label: 'Brown Spot', confidence: 0.88 }],
      isAnalyzing: true,
      error: 'Test error',
    });

    useInferenceStore.getState().reset();
    const state = useInferenceStore.getState();
    expect(state.imageUri).toBeNull();
    expect(state.detections).toBeNull();
    expect(state.isAnalyzing).toBe(false);
    expect(state.error).toBeNull();
  });
});
