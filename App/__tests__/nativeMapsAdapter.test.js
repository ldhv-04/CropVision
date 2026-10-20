/**
 * NativeMapsAdapter Unit & Inversion Tests
 * Validates coordinate transformation, listener lifecycle, and destroyed guards.
 * Strictly adheres to Rule 2.4 (>= 90% Coverage) and Rule 2.12.
 */

import { NativeMapsAdapter } from '../src/modules/agrivision/adapters/NativeMapsAdapter';

describe('NativeMapsAdapter - Unit & Lifecycle Tests', () => {
  let adapter;

  beforeEach(() => {
    adapter = new NativeMapsAdapter();
  });

  afterEach(() => {
    adapter.destroy();
  });

  test('initializes correctly with map reference and viewport', async () => {
    const mockRef = { animateToRegion: jest.fn() };
    await adapter.initialize(mockRef, { center: [106.5, 10.8], zoom: 16 });

    expect(adapter._mapRef).toBe(mockRef);
    expect(adapter._viewport.center).toEqual([106.5, 10.8]);
    expect(adapter._viewport.zoom).toBe(16);
    expect(adapter._isDestroyed).toBe(false);
  });

  test('setViewport updates center and zoom, and ignores if destroyed', () => {
    adapter.setViewport({ center: [107.0, 11.0], zoom: 12 });
    expect(adapter._viewport.center).toEqual([107.0, 11.0]);
    expect(adapter._viewport.zoom).toBe(12);

    adapter.destroy();
    adapter.setViewport({ center: [100.0, 20.0], zoom: 5 });
    expect(adapter._viewport.center).toEqual([107.0, 11.0]);
  });

  test('setFeatures handles valid arrays, non-arrays, and destroyed state', () => {
    const sampleFeatures = [{ id: 'f1', type: 'Feature' }];
    adapter.setFeatures(sampleFeatures);
    expect(adapter._features).toHaveLength(1);

    adapter.setFeatures(null);
    expect(adapter._features).toEqual([]);

    adapter.destroy();
    adapter.setFeatures(sampleFeatures);
    expect(adapter._features).toEqual([]);
  });

  test('selectFeature updates selected ID and obeys destroyed guard', () => {
    adapter.selectFeature('field-99');
    expect(adapter._selectedFeatureId).toBe('field-99');

    adapter.destroy();
    adapter.selectFeature('field-100');
    expect(adapter._selectedFeatureId).toBe('field-99');
  });

  test('onMapClick and onFeatureHover manage listener registration and unsubscribe', () => {
    const clickFn = jest.fn();
    const hoverFn = jest.fn();

    const unsubClick = adapter.onMapClick(clickFn);
    const unsubHover = adapter.onFeatureHover(hoverFn);

    expect(adapter._clickListeners.has(clickFn)).toBe(true);
    expect(adapter._hoverListeners.has(hoverFn)).toBe(true);

    unsubClick();
    unsubHover();

    expect(adapter._clickListeners.has(clickFn)).toBe(false);
    expect(adapter._hoverListeners.has(hoverFn)).toBe(false);

    // Non-function handlers return noop
    const noopClick = adapter.onMapClick(null);
    const noopHover = adapter.onFeatureHover('not-a-fn');
    expect(typeof noopClick).toBe('function');
    expect(typeof noopHover).toBe('function');
  });

  test('toNativeCoordinates transforms geojson [lon, lat] pairs to RN coords', () => {
    const ring = [
      [105.12, 21.05],
      [105.13, 21.05],
      [105.13, 21.06],
    ];
    const nativeCoords = adapter.toNativeCoordinates(ring);
    expect(nativeCoords).toEqual([
      { latitude: 21.05, longitude: 105.12 },
      { latitude: 21.05, longitude: 105.13 },
      { latitude: 21.06, longitude: 105.13 },
    ]);

    expect(adapter.toNativeCoordinates(null)).toEqual([]);
    expect(adapter.toNativeCoordinates('invalid')).toEqual([]);
  });

  test('updateLayer executes cleanly as declarative noop on mobile', () => {
    expect(() => adapter.updateLayer()).not.toThrow();
  });

  test('destroy cleans up all references and sets destroyed flag', () => {
    const clickFn = jest.fn();
    adapter.onMapClick(clickFn);
    adapter.setFeatures([{ id: 'f1' }]);
    adapter.destroy();

    expect(adapter._isDestroyed).toBe(true);
    expect(adapter._clickListeners.size).toBe(0);
    expect(adapter._hoverListeners.size).toBe(0);
    expect(adapter._features).toEqual([]);
    expect(adapter._mapRef).toBeNull();
  });
});
