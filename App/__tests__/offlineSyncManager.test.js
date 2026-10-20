/**
 * Test suite for Mobile Offline Sync Manager (Rule 1.1.3)
 */

import {
  queuePendingSample,
  getPendingSamples,
  removePendingSample,
  queuePendingWalk,
  getPendingWalks,
  removePendingWalk,
  getPendingItems,
  clearAllPending,
  syncPendingItems,
} from '../src/modules/@core/offline/offlineSyncManager';

import * as apiClient from '../src/modules/@core/api/apiClient';

describe('OfflineSyncManager', () => {
  beforeEach(async () => {
    await clearAllPending();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await clearAllPending();
  });

  test('queues and retrieves pending samples', async () => {
    const sample = await queuePendingSample({
      uri: 'file:///data/user/0/cache/photo.jpg',
      fileName: 'photo.jpg',
      fieldId: 'field-123',
      latitude: 16.05,
      longitude: 108.20,
    });

    expect(sample.id).toMatch(/^sample_/);
    expect(sample.status).toBe('pending');
    expect(sample.queuedAt).toBeDefined();

    const samples = await getPendingSamples();
    expect(samples.length).toBe(1);
    expect(samples[0].id).toBe(sample.id);
    expect(samples[0].fieldId).toBe('field-123');

    await removePendingSample(sample.id);
    const updated = await getPendingSamples();
    expect(updated.length).toBe(0);
  });

  test('queues and retrieves pending walks', async () => {
    const walk = await queuePendingWalk({
      fieldId: 'field-456',
      walkId: 'walk-001',
      points: [
        { latitude: 16.05, longitude: 108.20 },
        { latitude: 16.051, longitude: 108.201 },
      ],
    });

    expect(walk.id).toMatch(/^walk_/);
    expect(walk.status).toBe('pending');

    const walks = await getPendingWalks();
    expect(walks.length).toBe(1);
    expect(walks[0].points.length).toBe(2);

    await removePendingWalk(walk.id);
    const updated = await getPendingWalks();
    expect(updated.length).toBe(0);
  });

  test('aggregates pending items across queues and clears all', async () => {
    await queuePendingSample({ uri: 'sample1.jpg' });
    await queuePendingSample({ uri: 'sample2.jpg' });
    await queuePendingWalk({ fieldId: 'f1', points: [] });

    const summary = await getPendingItems();
    expect(summary.samples.length).toBe(2);
    expect(summary.walks.length).toBe(1);
    expect(summary.totalCount).toBe(3);

    await clearAllPending();
    const afterClear = await getPendingItems();
    expect(afterClear.totalCount).toBe(0);
  });

  test('syncPendingItems successfully syncs and removes items', async () => {
    const spy = jest.spyOn(apiClient, 'apiRequest').mockResolvedValue({ success: true });

    await queuePendingSample({ uri: 'sample1.jpg', fieldId: 'f1' });
    await queuePendingWalk({ fieldId: 'f1', points: [{ latitude: 1, longitude: 2 }] });

    const result = await syncPendingItems('fake-jwt-token');
    expect(result.syncedSamples).toBe(1);
    expect(result.syncedWalks).toBe(1);
    expect(result.errors.length).toBe(0);

    const pending = await getPendingItems();
    expect(pending.totalCount).toBe(0);

    spy.mockRestore();
  });
});
