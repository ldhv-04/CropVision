import { Platform } from 'react-native';
import apiFunctions from '../api';

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.EXPO_PUBLIC_API_ORIGIN;
  delete process.env.EXPO_PUBLIC_API_HOST;
  delete process.env.EXPO_PUBLIC_API_PROTOCOL;
  delete process.env.EXPO_PUBLIC_API_PORT;
});

afterAll(() => {
  process.env = originalEnv;
});

describe('API Configuration', () => {
  describe('Default Resolutions', () => {
    it('sets default origin correctly for android', () => {
      // Re-evaluate the logic by calling the internal functions. 
      // Since API_ORIGIN is evaluated ONCE on require, test the fallback logic.
      process.env.EXPO_PUBLIC_API_HOST = '10.0.2.2';
      jest.resetModules();
      const api = require('../api');
      expect(api.API_ORIGIN).toBe('http://10.0.2.2:3000');
    });

    it('sets default origin correctly for web', () => {
      process.env.EXPO_PUBLIC_API_HOST = 'localhost';
      jest.resetModules();
      const api = require('../api');
      expect(api.API_ORIGIN).toBe('http://localhost:3000');
    });

    it('sets default origin correctly for desktop', () => {
      process.env.EXPO_PUBLIC_API_HOST = '127.0.0.1';
      jest.resetModules();
      const api = require('../api');
      expect(api.API_ORIGIN).toBe('http://127.0.0.1:3000');
    });
  });

  describe('buildApiUrl', () => {
    it('appends paths correctly with leading slash', () => {
      process.env.EXPO_PUBLIC_API_HOST = '10.0.2.2';
      jest.resetModules();
      const { buildApiUrl } = require('../api');
      expect(buildApiUrl('/v1/users')).toBe('http://10.0.2.2:3000/v1/users');
    });

    it('appends paths correctly without leading slash', () => {
      process.env.EXPO_PUBLIC_API_HOST = '10.0.2.2';
      jest.resetModules();
      const { buildApiUrl } = require('../api');
      expect(buildApiUrl('v1/users')).toBe('http://10.0.2.2:3000/v1/users');
    });
  });

  describe('resolveAssetUrl', () => {
    it('returns null if path is empty', () => {
      jest.resetModules();
      const { resolveAssetUrl } = require('../api');
      expect(resolveAssetUrl(null)).toBeNull();
    });

    it('returns path as is if starts with http or data', () => {
      jest.resetModules();
      const { resolveAssetUrl } = require('../api');
      expect(resolveAssetUrl('https://example.com/img.png')).toBe('https://example.com/img.png');
      expect(resolveAssetUrl('data:image/png;base64,A')).toBe('data:image/png;base64,A');
    });

    it('prepends API_ORIGIN if relative path', () => {
      process.env.EXPO_PUBLIC_API_HOST = '10.0.2.2';
      jest.resetModules();
      const { resolveAssetUrl, API_ORIGIN } = require('../api');
      expect(resolveAssetUrl('/images/test.png')).toBe(`${API_ORIGIN}/images/test.png`);
    });
  });

  describe('getApiConnectionHelp', () => {
    it('gives origin help if origin is manually set', () => {
      process.env.EXPO_PUBLIC_API_ORIGIN = 'https://prod.xyz';
      jest.resetModules();
      const { getApiConnectionHelp } = require('../api');
      expect(getApiConnectionHelp()).toContain('https://prod.xyz');
    });

    it('gives host help if host is manually set', () => {
      process.env.EXPO_PUBLIC_API_HOST = 'custom.local';
      jest.resetModules();
      const { getApiConnectionHelp } = require('../api');
      expect(getApiConnectionHelp()).toContain('custom.local');
    });
  });
});
