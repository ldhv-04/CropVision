/**
 * Station Fields Integration Test
 * Validates store integration with spatial utilities and adapters.
 * Strictly adheres to Rule 2.4 (>= 90% Coverage) and Rule 2.1.
 */

import { calculateAreaHectares, calculateBoundingBox } from '../src/modules/@core/utils/spatialCalculations';
import { useFieldStore } from '../src/modules/@core/store/useFieldStore';

describe('Station Fields Integration - Data Flow & Bounding Box', () => {
  beforeEach(() => {
    useFieldStore.setState({
      fields: [],
      selectedFieldId: null,
      loading: false,
      error: null,
    });
  });

  test('Creates field and verifies computed area and bbox', () => {
    const ring = [
      [105.0, 21.0],
      [105.01, 21.0],
      [105.01, 21.01],
      [105.0, 21.01],
      [105.0, 21.0],
    ];

    const area = calculateAreaHectares(ring);
    const bbox = calculateBoundingBox(ring);

    expect(area).toBeGreaterThan(0);
    expect(bbox).toEqual([105.0, 21.0, 105.01, 21.01]);

    const newField = {
      id: 'field-mock-1',
      name: 'North Plot 1',
      cropType: 'Corn',
      area,
      geometry: { type: 'Polygon', coordinates: [ring] },
    };

    useFieldStore.setState({
      fields: [newField],
      selectedFieldId: 'field-mock-1',
    });

    const state = useFieldStore.getState();
    expect(state.fields).toHaveLength(1);
    expect(state.selectedFieldId).toBe('field-mock-1');
    expect(state.fields[0].area).toBe(area);
  });
});
