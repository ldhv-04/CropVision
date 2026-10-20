import {
  queuePendingSample,
  getPendingSamples,
  removePendingSample,
  clearAllPending,
} from '../src/modules/@core/offline/offlineSyncManager';

describe('Offline Queue Concurrency Stress Tests (US2 / Rule 2.12)', () => {
  beforeEach(async () => {
    await clearAllPending();
  });

  afterAll(async () => {
    await clearAllPending();
  });

  test('Handles burst of 10 sequential enqueue requests without loss', async () => {
    for (let i = 0; i < 10; i++) {
      await queuePendingSample({
        field_id: `field-${i}`,
        disease_name: 'Rice Blast',
        confidence: 0.95,
      });
    }

    const pending = await getPendingSamples();
    expect(pending.length).toBe(10);
  });

  test('Removes pending samples cleanly after sync acknowledgment', async () => {
    const sample = await queuePendingSample({
      field_id: 'field-ack-1',
      disease_name: 'Brown Spot',
    });

    let pending = await getPendingSamples();
    expect(pending.length).toBe(1);

    await removePendingSample(sample.id);
    pending = await getPendingSamples();
    expect(pending.length).toBe(0);
  });
});
