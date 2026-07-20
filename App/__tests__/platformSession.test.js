import { apiRequest } from '../src/modules/@core/api/apiClient';
import {
  getSessionToken,
  setSessionTokenProvider,
} from '../src/modules/@core/session/sessionProvider';
import { getRuntimePlatform } from '../src/modules/platform/runtime';

const originalFetch = global.fetch;

afterEach(() => {
  setSessionTokenProvider(null);
  global.fetch = originalFetch;
});

test('runtime capability distinguishes Electron from browser through the preload bridge', () => {
  expect(getRuntimePlatform({ platformOS: 'web', electronAPI: null })).toBe('web');
  expect(getRuntimePlatform({ platformOS: 'web', electronAPI: { platform: 'electron' } })).toBe('electron');
  expect(getRuntimePlatform({ platformOS: 'android' })).toBe('android');
});

test('session provider validates and supplies the transport token', async () => {
  expect(getSessionToken()).toBeNull();
  expect(() => setSessionTokenProvider('token')).toThrow(TypeError);

  setSessionTokenProvider(() => 'task-token');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
  });

  await apiRequest('/api/test');
  expect(global.fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer task-token' }),
    }),
  );
});
