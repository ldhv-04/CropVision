/**
 * MapLibreGLAdapter Unit Tests - Layer Management, Viewport, and Event Dispatch
 * Strictly adheres to Rule 2.4 (>= 90% Test Coverage Gate)
 * and Rule 2.1 (<= 300 LOC).
 */

import { MapLibreGLAdapter } from '../src/modules/station/adapters/MapLibreGLAdapter';

describe('MapLibreGLAdapter - Layer Management & Ingestion', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new MapLibreGLAdapter();
    await adapter.initialize({}, { center: [106.6, 10.8], zoom: 11, pitch: 15, bearing: 45 });
  });

  afterEach(() => {
    adapter.destroy();
  });

  test('Correctly manages layer visibility and opacity', () => {
    adapter.updateLayer({ layerId: 'satellite-tiles', visible: true, opacity: 0.75 });
    const layer = adapter._map.layers.get('satellite-tiles');
    expect(layer).toBeDefined();
    expect(layer.visible).toBe(true);
    expect(layer.opacity).toBe(0.75);

    adapter.updateLayer({ layerId: 'satellite-tiles', visible: false, opacity: 0.0 });
    expect(adapter._map.layers.get('satellite-tiles').visible).toBe(false);
  });

  test('Ingests GeoJSON features and updates source structure', () => {
    const mockFeatures = [
      {
        id: 'f-101',
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[[105, 21], [106, 21], [106, 22], [105, 22], [105, 21]]] },
        properties: { name: 'Parcel A', cropType: 'Rice' },
      },
    ];

    adapter.setFeatures(mockFeatures);
    const source = adapter._map.sources.get('fields-source');
    expect(source).toBeDefined();
    expect(source.data.features).toHaveLength(1);
    expect(source.data.features[0].id).toBe('f-101');
  });

  test('selectFeature and event listeners manage dispatch and lifecycle', () => {
    const clickHandler = jest.fn();
    const hoverHandler = jest.fn();

    const unsubClick = adapter.onMapClick(clickHandler);
    const unsubHover = adapter.onFeatureHover(hoverHandler);

    adapter.selectFeature('f-101');
    expect(adapter._selectedFeatureId).toBe('f-101');

    adapter.dispatchClick({ lngLat: [105.5, 21.5] });
    expect(clickHandler).toHaveBeenCalledWith({ lngLat: [105.5, 21.5] });

    adapter.dispatchHover('f-101');
    expect(hoverHandler).toHaveBeenCalledWith('f-101');

    unsubClick();
    unsubHover();

    // Invalid non-function registration
    const noopClick = adapter.onMapClick(null);
    const noopHover = adapter.onFeatureHover(123);
    expect(typeof noopClick).toBe('function');
    expect(typeof noopHover).toBe('function');
  });

  test('Safely ignores operations after destroy', () => {
    adapter.destroy();
    expect(adapter._isDestroyed).toBe(true);
    // Should not throw
    adapter.setViewport({ zoom: 15 });
    adapter.setFeatures([]);
    adapter.selectFeature('f-1');
    adapter.updateLayer({ layerId: 'test', visible: true, opacity: 1 });
    adapter.dispatchClick({});
    adapter.dispatchHover('f-1');
  });
});
