/**
 * Offline Sync Manager — Mobile Offline-First Core Module
 *
 * Implements an asynchronous queue for offline data collection (Rule 1.1.3):
 *   - PENDING_SAMPLES: Scanned crop samples queued when offline/in-field
 *   - PENDING_WALKS: GPS perimeter walk points recorded during field surveying
 *
 * Persists data via AsyncStorage (Native) or localStorage (Web) with memory fallback.
 */

import { Platform } from 'react-native';
import { apiRequest } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const KEY_PENDING_SAMPLES = '@cropvision/pending_samples';
const KEY_PENDING_WALKS = '@cropvision/pending_walks';

const memoryStore = new Map();

const storage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  },

  async setItem(key, value) {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },

  async removeItem(key) {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

const getJsonList = async (key) => {
  const raw = await storage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const setJsonList = async (key, list) => {
  await storage.setItem(key, JSON.stringify(list));
};

export const queuePendingSample = async (sample) => {
  const item = {
    id: `sample_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...sample,
    queuedAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };
  const list = await getJsonList(KEY_PENDING_SAMPLES);
  list.push(item);
  await setJsonList(KEY_PENDING_SAMPLES, list);
  return item;
};

export const getPendingSamples = async () => getJsonList(KEY_PENDING_SAMPLES);

export const removePendingSample = async (id) => {
  const list = await getJsonList(KEY_PENDING_SAMPLES);
  const filtered = list.filter((s) => s.id !== id);
  await setJsonList(KEY_PENDING_SAMPLES, filtered);
};

export const queuePendingWalk = async (walk) => {
  const item = {
    id: `walk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...walk,
    queuedAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };
  const list = await getJsonList(KEY_PENDING_WALKS);
  list.push(item);
  await setJsonList(KEY_PENDING_WALKS, list);
  return item;
};

export const getPendingWalks = async () => getJsonList(KEY_PENDING_WALKS);

export const removePendingWalk = async (id) => {
  const list = await getJsonList(KEY_PENDING_WALKS);
  const filtered = list.filter((w) => w.id !== id);
  await setJsonList(KEY_PENDING_WALKS, filtered);
};

export const getPendingItems = async () => {
  const [samples, walks] = await Promise.all([
    getPendingSamples(),
    getPendingWalks(),
  ]);
  return { samples, walks, totalCount: samples.length + walks.length };
};

export const clearAllPending = async () => {
  await Promise.all([
    storage.removeItem(KEY_PENDING_SAMPLES),
    storage.removeItem(KEY_PENDING_WALKS),
  ]);
};

export const syncPendingItems = async (token) => {
  const { samples, walks } = await getPendingItems();
  let syncedSamples = 0;
  let syncedWalks = 0;
  const errors = [];

  for (const sample of samples) {
    try {
      const formData = new FormData();
      if (sample.uri) {
        formData.append('image', {
          uri: sample.uri,
          name: sample.fileName || 'offline_sample.jpg',
          type: 'image/jpeg',
        });
      }
      if (sample.fieldId) formData.append('field_id', sample.fieldId);
      if (sample.latitude) formData.append('latitude', String(sample.latitude));
      if (sample.longitude) formData.append('longitude', String(sample.longitude));

      await apiRequest(ENDPOINTS.inference.analyze, {
        method: 'POST',
        body: formData,
      }, token);

      await removePendingSample(sample.id);
      syncedSamples++;
    } catch (err) {
      errors.push({ id: sample.id, type: 'sample', message: err.message });
      break; // Pause synchronization on network disconnection
    }
  }

  for (const walk of walks) {
    try {
      if (walk.fieldId && walk.points) {
        await apiRequest(ENDPOINTS.walk.points(walk.fieldId, walk.walkId || 'offline'), {
          method: 'POST',
          body: { points: walk.points },
        }, token);
      }
      await removePendingWalk(walk.id);
      syncedWalks++;
    } catch (err) {
      errors.push({ id: walk.id, type: 'walk', message: err.message });
      break;
    }
  }

  return { syncedSamples, syncedWalks, errors };
};
