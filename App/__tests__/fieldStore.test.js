/**
 * Canonical Field Store Unit & Integration Tests
 * Validates CRUD, Sub-Zone management, Weather caching, and Error resilience.
 * Adheres to Rule 2.4 (>= 90% Coverage) and Rule 2.12 (Inversion & Stress).
 */

import api from '../src/modules/@core/api';
import { useFieldStore } from '../src/modules/@core/store/useFieldStore';

jest.mock('../src/modules/@core/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('useFieldStore - Canonical State & Inversion Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFieldStore.getState().reset();
  });

  describe('Field CRUD Operations', () => {
    test('fetchFields populates fields list on success and handles error', async () => {
      const mockFields = [{ id: 'f1', name: 'Field 1' }, { id: 'f2', name: 'Field 2' }];
      api.get.mockResolvedValueOnce({ data: mockFields });

      const result = await useFieldStore.getState().fetchFields('mock-token');
      expect(result).toEqual(mockFields);
      expect(useFieldStore.getState().fields).toEqual(mockFields);
      expect(useFieldStore.getState().loading).toBe(false);

      // Error path
      api.get.mockRejectedValueOnce(new Error('Network failure'));
      const errResult = await useFieldStore.getState().fetchFields();
      expect(errResult).toEqual([]);
      expect(useFieldStore.getState().error).toBe('Network failure');
    });

    test('fetchField fetches single field and guards against null id', async () => {
      expect(await useFieldStore.getState().fetchField(null)).toBeNull();

      const mockField = { id: 'f10', name: 'Delta Field' };
      api.get.mockResolvedValueOnce({ data: mockField });

      const res = await useFieldStore.getState().fetchField('f10');
      expect(res).toEqual(mockField);
      expect(useFieldStore.getState().currentField).toEqual(mockField);
      expect(useFieldStore.getState().selectedFieldId).toBe('f10');

      // Error path
      api.get.mockRejectedValueOnce(new Error('Field not found'));
      const errRes = await useFieldStore.getState().fetchField('f999');
      expect(errRes).toBeNull();
      expect(useFieldStore.getState().error).toBe('Field not found');
    });

    test('createField supports polymorphic argument order and handles failure', async () => {
      const created = { id: 'new-1', name: 'New Rice Field' };
      api.post.mockResolvedValueOnce({ data: created });

      // Polymorphic call 1: createField(data)
      const res1 = await useFieldStore.getState().createField({ name: 'New Rice Field' });
      expect(res1.id).toBe('new-1');
      expect(res1.success).toBe(true);
      expect(useFieldStore.getState().fields[0].id).toBe('new-1');

      // Polymorphic call 2: createField(token, data)
      api.post.mockResolvedValueOnce({ data: { id: 'new-2', name: 'Second Field' } });
      const res2 = await useFieldStore.getState().createField('token-abc', { name: 'Second Field' });
      expect(res2.id).toBe('new-2');

      // Error path
      api.post.mockRejectedValueOnce(new Error('Validation error'));
      const errRes = await useFieldStore.getState().createField({ name: 'Invalid' });
      expect(errRes).toBeNull();
      expect(useFieldStore.getState().error).toBe('Validation error');
    });

    test('updateField updates store element and currentField', async () => {
      useFieldStore.setState({
        fields: [{ id: 'u1', name: 'Old' }, { id: 'u2', name: 'Other' }],
        currentField: { id: 'u1', name: 'Old' },
      });

      const updated = { id: 'u1', name: 'Updated Name' };
      api.put.mockResolvedValueOnce({ data: updated });

      const res = await useFieldStore.getState().updateField('u1', { name: 'Updated Name' });
      expect(res).toEqual(updated);
      expect(useFieldStore.getState().currentField.name).toBe('Updated Name');
      expect(useFieldStore.getState().fields.find((f) => f.id === 'u1').name).toBe('Updated Name');

      // Error path
      api.put.mockRejectedValueOnce(new Error('Update failed'));
      const errRes = await useFieldStore.getState().updateField('u1', {});
      expect(errRes).toBeNull();
    });

    test('deleteField removes field and resets currentField if selected', async () => {
      useFieldStore.setState({
        fields: [{ id: 'd1', name: 'To Delete' }, { id: 'd2', name: 'Keep' }],
        currentField: { id: 'd1', name: 'To Delete' },
        selectedFieldId: 'd1',
      });

      api.delete.mockResolvedValueOnce({});
      const success = await useFieldStore.getState().deleteField('d1');
      expect(success).toBe(true);
      expect(useFieldStore.getState().fields).toHaveLength(1);
      expect(useFieldStore.getState().currentField).toBeNull();
      expect(useFieldStore.getState().selectedFieldId).toBeNull();

      // Error path
      api.delete.mockRejectedValueOnce(new Error('Delete error'));
      const errRes = await useFieldStore.getState().deleteField('d2');
      expect(errRes).toBe(false);
    });
  });

  describe('Sub-Zone Operations', () => {
    test('fetchZones and fetchZonesSummary load sub-zones', async () => {
      const zones = [{ id: 'z1', name: 'Zone A' }];
      api.get.mockResolvedValueOnce({ data: zones });

      const res = await useFieldStore.getState().fetchZones('field-1');
      expect(res).toEqual(zones);
      expect(useFieldStore.getState().currentZones).toEqual(zones);

      // Summary
      api.get.mockResolvedValueOnce({ data: { zones: [{ id: 'z2', name: 'Zone B' }] } });
      await useFieldStore.getState().fetchZonesSummary('field-1');
      expect(useFieldStore.getState().currentZones[0].id).toBe('z2');

      // Error paths
      api.get.mockRejectedValueOnce(new Error('Zone error'));
      expect(await useFieldStore.getState().fetchZones('f1')).toEqual([]);

      api.get.mockRejectedValueOnce(new Error('Summary error'));
      expect(await useFieldStore.getState().fetchZonesSummary('f1')).toBeNull();
    });

    test('createZone, updateZone, deleteZone manage zones state', async () => {
      const createdZone = { id: 'z10', name: 'Block 10' };
      api.post.mockResolvedValueOnce({ data: createdZone });

      await useFieldStore.getState().createZone('f1', createdZone);
      expect(useFieldStore.getState().currentZones).toHaveLength(1);

      const updatedZone = { id: 'z10', name: 'Block 10 Updated' };
      api.put.mockResolvedValueOnce({ data: updatedZone });
      await useFieldStore.getState().updateZone('z10', updatedZone);
      expect(useFieldStore.getState().getZoneById('z10').name).toBe('Block 10 Updated');

      api.delete.mockResolvedValueOnce({});
      const delSuccess = await useFieldStore.getState().deleteZone('z10');
      expect(delSuccess).toBe(true);
      expect(useFieldStore.getState().currentZones).toHaveLength(0);

      // Error paths
      api.post.mockRejectedValueOnce(new Error('Create zone error'));
      expect(await useFieldStore.getState().createZone('f1', {})).toBeNull();

      api.put.mockRejectedValueOnce(new Error('Update zone error'));
      expect(await useFieldStore.getState().updateZone('z1', {})).toBeNull();

      api.delete.mockRejectedValueOnce(new Error('Delete zone error'));
      expect(await useFieldStore.getState().deleteZone('z1')).toBe(false);
    });
  });

  describe('Activities & Weather & Helper Selectors', () => {
    test('fetchActivities and addActivity handle happy and catch paths', async () => {
      api.get.mockResolvedValueOnce({ data: [{ id: 'act-1', type: 'spray' }] });
      const acts = await useFieldStore.getState().fetchActivities('f1');
      expect(acts).toHaveLength(1);

      api.get.mockRejectedValueOnce(new Error('Activity error'));
      expect(await useFieldStore.getState().fetchActivities('f1')).toEqual([]);

      api.post.mockResolvedValueOnce({ data: { id: 'act-2' } });
      const added = await useFieldStore.getState().addActivity('f1', {});
      expect(added.id).toBe('act-2');

      api.post.mockRejectedValueOnce(new Error('Add act error'));
      expect(await useFieldStore.getState().addActivity('f1', {})).toBeNull();
    });

    test('fetchWeatherForField populates weather cache by fieldId', async () => {
      // Guard when coordinates missing
      await useFieldStore.getState().fetchWeatherForField('token', { id: 'no-coords' });
      expect(useFieldStore.getState().weatherByField).toEqual({});

      const mockWeather = { temp: 28, humidity: 80 };
      api.get.mockResolvedValueOnce({ data: mockWeather });

      await useFieldStore.getState().fetchWeatherForField('token', {
        id: 'f-weather',
        latitude: 10.5,
        longitude: 106.5,
      });

      expect(useFieldStore.getState().weatherByField['f-weather']).toEqual(mockWeather);
    });

    test('selection helpers and clearError operate accurately', () => {
      useFieldStore.setState({
        fields: [{ id: 's1', name: 'Plot 1' }, { id: 's2', name: 'Plot 2' }],
        error: 'Some error',
      });

      useFieldStore.getState().selectField('s2');
      expect(useFieldStore.getState().selectedFieldId).toBe('s2');
      expect(useFieldStore.getState().currentField.name).toBe('Plot 2');

      useFieldStore.getState().setCurrentField({ id: 's3', name: 'Plot 3' });
      expect(useFieldStore.getState().selectedFieldId).toBe('s3');

      useFieldStore.getState().clearError();
      expect(useFieldStore.getState().error).toBeNull();
    });
  });
});
