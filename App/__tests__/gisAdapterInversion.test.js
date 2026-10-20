/**
 * Adversarial Inversion Tests for GIS SPI & Spatial Engine
 * Strictly adheres to Rule 2.12 (Inversion-Driven Test Generation)
 * and Rule 2.4 (>= 90% Test Coverage Gate).
 */

import {
  isValidLinearRing,
  calculateBoundingBox,
  calculateCentroid,
  calculateAreaHectares,
  isPointInPolygon,
} from '../src/modules/@core/utils/spatialCalculations';
import { MapLibreGLAdapter } from '../src/modules/station/adapters/MapLibreGLAdapter';
import { NativeMapsAdapter } from '../src/modules/agrivision/adapters/NativeMapsAdapter';

describe('Spatial Calculations - Inversion & Degenerate Matrix', () => {
  const validSquareRing = [
    [105.0, 21.0],
    [105.1, 21.0],
    [105.1, 21.1],
    [105.0, 21.1],
    [105.0, 21.0],
  ];

  test('Rejects degenerate linear rings (null, empty, unclosed, NaN)', () => {
    expect(isValidLinearRing(null)).toBe(false);
    expect(isValidLinearRing(undefined)).toBe(false);
    expect(isValidLinearRing([])).toBe(false);
    expect(isValidLinearRing([[105, 21]])).toBe(false);
    // 3 points (unclosed triangle)
    expect(isValidLinearRing([[105, 21], [106, 21], [105, 22]])).toBe(false);
    // Unclosed 4 points
    expect(isValidLinearRing([[105, 21], [106, 21], [106, 22], [105, 22]])).toBe(false);
    // NaN coordinate
    expect(isValidLinearRing([[105, NaN], [106, 21], [106, 22], [105, NaN]])).toBe(false);
    // Out-of-bounds latitude
    expect(isValidLinearRing([[105, 95], [106, 95], [106, 96], [105, 95]])).toBe(false);
  });

  test('Validates RFC 7946 compliant closed polygon ring', () => {
    expect(isValidLinearRing(validSquareRing)).toBe(true);
  });

  test('Calculates bounding box and handles degenerate inputs safely', () => {
    expect(calculateBoundingBox([])).toBeNull();
    expect(calculateBoundingBox(validSquareRing)).toEqual([105.0, 21.0, 105.1, 21.1]);
  });

  test('Calculates centroid and handles degenerate inputs safely', () => {
    expect(calculateCentroid(null)).toBeNull();
    const centroid = calculateCentroid(validSquareRing);
    expect(centroid).toEqual([105.05, 21.05]);
  });

  test('Calculates area in hectares and guarantees non-negative value', () => {
    expect(calculateAreaHectares(null)).toBe(0);
    expect(calculateAreaHectares([])).toBe(0);
    const area = calculateAreaHectares(validSquareRing);
    expect(area).toBeGreaterThan(0);
  });

  test('Performs ray-casting point-in-polygon correctly', () => {
    expect(isPointInPolygon([105.05, 21.05], validSquareRing)).toBe(true);
    expect(isPointInPolygon([104.9, 21.05], validSquareRing)).toBe(false);
    expect(isPointInPolygon(null, validSquareRing)).toBe(false);
    expect(isPointInPolygon([105.05, 21.05], [])).toBe(false);
  });
});

describe('GIS SPI Adapters - Lifecycle & Event Subscriptions', () => {
  test('MapLibreGLAdapter initializes, updates viewport, and dispatches events', async () => {
    const adapter = new MapLibreGLAdapter();
    const mockContainer = {};

    await adapter.initialize(mockContainer, { center: [105.8, 21.0], zoom: 12 });
    adapter.setViewport({ zoom: 14, pitch: 30 });
    adapter.setFeatures([{ id: 'field-1', type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} }]);
    adapter.selectFeature('field-1');
    adapter.updateLayer({ layerId: 'ndvi', visible: true, opacity: 0.8 });

    let clicked = null;
    const unsubClick = adapter.onMapClick((e) => {
      clicked = e;
    });
    adapter.dispatchClick({ coordinates: [105.85, 21.05], featureId: 'field-1' });
    expect(clicked).toEqual({ coordinates: [105.85, 21.05], featureId: 'field-1' });

    unsubClick();
    adapter.dispatchClick({ coordinates: [0, 0] });
    expect(clicked.coordinates).toEqual([105.85, 21.05]); // Unchanged after unsub

    let hovered = null;
    adapter.onFeatureHover((id) => {
      hovered = id;
    });
    adapter.dispatchHover('field-1');
    expect(hovered).toBe('field-1');

    adapter.destroy();
    expect(adapter._isDestroyed).toBe(true);
    expect(adapter._map).toBeNull();
  });

  test('NativeMapsAdapter translates coordinates and handles lifecycle', async () => {
    const adapter = new NativeMapsAdapter();
    await adapter.initialize({}, { center: [106.0, 20.0], zoom: 10 });

    const nativeCoords = adapter.toNativeCoordinates([[105.0, 21.0], [105.1, 21.1]]);
    expect(nativeCoords).toEqual([
      { longitude: 105.0, latitude: 21.0 },
      { longitude: 105.1, latitude: 21.1 },
    ]);
    expect(adapter.toNativeCoordinates(null)).toEqual([]);

    adapter.selectFeature('field-2');
    adapter.setFeatures([{ id: 'field-2' }]);
    adapter.destroy();
    expect(adapter._isDestroyed).toBe(true);
  });
});
