/**
 * inversionStress.test.js — Inversion Thinking & Adversarial Stress Test Suite
 *
 * Validates resilience against 4 adversarial failure modes:
 * 1. Sudden Network Disconnect during fetch/sync
 * 2. Concurrency Storm & State Contention on Store
 * 3. Corrupted Cache / Storage Failure Recovery
 * 4. Degenerate GeoJSON Geometry Defense
 */

import { useFieldStore } from '../src/modules/@core/store/useFieldStore';
import api from '../src/modules/@core/api';
import * as apiClient from '../src/modules/@core/api/apiClient';
import {
  queuePendingSample,
  getPendingSamples,
  getPendingItems,
  clearAllPending,
  syncPendingItems,
} from '../src/modules/@core/offline/offlineSyncManager';
import {
  extractPolygonCoords,
  extractAllPolygons,
  calculateBounds,
  calculateFieldBounds,
  calculateCentroid,
  toGeoJsonPolygon,
} from '../src/modules/agrivision/utils/mapHelpers';

describe('Inversion Thinking Stress Suite', () => {
  beforeEach(async () => {
    useFieldStore.getState().reset();
    await clearAllPending();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await clearAllPending();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Sudden Network Disconnection & Unreachable Backend
  // ──────────────────────────────────────────────────────────────────────────
  describe('Adversarial Test 1: Network Failure & Disconnection', () => {
    test('useFieldStore handles network drop gracefully without lockup', async () => {
      const getSpy = jest.spyOn(api, 'get').mockRejectedValue(
        new Error('Network request failed: ENOTFOUND')
      );

      const store = useFieldStore.getState();
      expect(store.loading).toBe(false);

      const result = await store.fetchFields();

      expect(result).toEqual([]);
      const stateAfter = useFieldStore.getState();
      expect(stateAfter.loading).toBe(false);
      expect(stateAfter.isLoading).toBe(false);
      expect(stateAfter.error).toContain('Network request failed');

      getSpy.mockRestore();
    });

    test('createField handles backend 503 timeout without corrupting list', async () => {
      const postSpy = jest.spyOn(api, 'post').mockRejectedValue(
        new Error('503 Service Unavailable')
      );

      // Prepopulate with 1 existing field
      useFieldStore.setState({
        fields: [{ id: 'f-existing', name: 'Vườn tiêu' }],
      });

      const store = useFieldStore.getState();
      const result = await store.createField({ name: 'Vườn cà phê mới' });

      expect(result).toBeNull();
      const stateAfter = useFieldStore.getState();
      expect(stateAfter.isCreating).toBe(false);
      expect(stateAfter.loading).toBe(false);
      expect(stateAfter.fields.length).toBe(1);
      expect(stateAfter.fields[0].id).toBe('f-existing');

      postSpy.mockRestore();
    });

    test('offline sync preserves all queued items on network outage', async () => {
      const reqSpy = jest.spyOn(apiClient, 'apiRequest').mockRejectedValue(
        new Error('Network unreachable')
      );

      await queuePendingSample({ uri: 'offline_photo.jpg', fieldId: 'f-1' });
      const queuedBefore = await getPendingSamples();
      expect(queuedBefore.length).toBe(1);

      const syncResult = await syncPendingItems('sample-token');
      expect(syncResult.syncedSamples).toBe(0);
      expect(syncResult.errors.length).toBe(1);

      // Verify zero data loss: item MUST remain in queue
      const queuedAfter = await getPendingSamples();
      expect(queuedAfter.length).toBe(1);
      expect(queuedAfter[0].id).toBe(queuedBefore[0].id);

      reqSpy.mockRestore();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Concurrency Storm & State Contention
  // ──────────────────────────────────────────────────────────────────────────
  describe('Adversarial Test 2: Concurrency Storm & Race Conditions', () => {
    test('handles 50 concurrent fetch requests without state tearing', async () => {
      const mockList = [
        { id: 'f-1', name: 'Field 1' },
        { id: 'f-2', name: 'Field 2' },
      ];

      const getSpy = jest.spyOn(api, 'get').mockImplementation(async () => {
        // Random micro-delay to simulate network jitter
        await new Promise((r) => setTimeout(r, Math.random() * 20));
        return { success: true, data: mockList };
      });

      const promises = Array.from({ length: 50 }, () =>
        useFieldStore.getState().fetchFields()
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(50);

      const state = useFieldStore.getState();
      expect(state.loading).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.fields.length).toBe(2);
      expect(state.error).toBeNull();

      getSpy.mockRestore();
    });

    test('handles burst concurrent field creation without dropping writes', async () => {
      let counter = 0;
      const postSpy = jest.spyOn(api, 'post').mockImplementation(async (url, data) => {
        counter++;
        return { success: true, data: { id: `field-burst-${counter}`, ...data } };
      });

      const creations = Array.from({ length: 15 }, (_, i) =>
        useFieldStore.getState().createField({ name: `Lô đất ${i + 1}` })
      );

      const created = await Promise.all(creations);
      expect(created.every(Boolean)).toBe(true);

      const state = useFieldStore.getState();
      expect(state.fields.length).toBe(15);
      expect(state.isCreating).toBe(false);

      postSpy.mockRestore();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Corrupted Storage & Truncated JSON Resilience
  // ──────────────────────────────────────────────────────────────────────────
  describe('Adversarial Test 3: Corrupted Storage Recovery', () => {
    test('mapHelpers safely handles corrupted JSON strings without throwing', () => {
      const corruptedInputs = [
        '{malformed_json: true,',
        'undefined',
        '',
        '{"type": "Polygon", "coordinates": NaN}',
      ];

      corruptedInputs.forEach((badInput) => {
        expect(() => extractPolygonCoords(badInput)).not.toThrow();
        expect(extractPolygonCoords(badInput)).toEqual([]);

        expect(() => extractAllPolygons(badInput)).not.toThrow();
        expect(extractAllPolygons(badInput)).toEqual([]);
      });
    });

    test('calculateCentroid gracefully handles empty and corrupt inputs', () => {
      expect(calculateCentroid([])).toEqual([0, 0]);
      expect(calculateCentroid(null)).toEqual([0, 0]);
      expect(calculateCentroid(undefined)).toEqual([0, 0]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Degenerate GeoJSON Geometry Defense
  // ──────────────────────────────────────────────────────────────────────────
  describe('Adversarial Test 4: Degenerate GeoJSON Geometry Defense', () => {
    test('calculateBounds safely returns null on degenerate geometries', () => {
      expect(calculateBounds(null)).toBeNull();
      expect(calculateBounds([])).toBeNull();
      expect(calculateBounds(undefined)).toBeNull();
    });

    test('calculateFieldBounds handles zones with null/corrupted boundaries', () => {
      const degenerateZones = [
        { id: 1, boundary: null },
        { id: 2, boundary: '{broken' },
        { id: 3, boundary: { type: 'Point', coordinates: [108.2, 16.0] } },
        { id: 4, boundary: { type: 'Polygon', coordinates: [] } },
      ];

      expect(() => calculateFieldBounds(degenerateZones)).not.toThrow();
      expect(calculateFieldBounds(degenerateZones)).toBeNull();
    });

    test('toGeoJsonPolygon automatically closes unclosed polygon rings', () => {
      const openRing = [
        [16.0, 108.2],
        [16.1, 108.2],
        [16.1, 108.3],
      ];

      const polygon = toGeoJsonPolygon(openRing);
      expect(polygon.type).toBe('Polygon');
      const ring = polygon.coordinates[0];
      expect(ring.length).toBe(4);
      // First and last point must match in GeoJSON ([lng, lat])
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    });
  });
});
