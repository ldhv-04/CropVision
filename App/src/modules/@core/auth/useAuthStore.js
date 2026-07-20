/**
 * useAuthStore — Layer 1 Core
 *
 * Zustand store replacing the old AuthContext.
 * Manages session state (user + token) for all 3 platforms.
 *
 * [H2] Token persistence: uses AsyncStorage on native, localStorage on web.
 *       On app start, rehydrate() restores the session from storage so the
 *       user doesn't get logged out on refresh.
 *
 * NO platform-specific imports. Pure JS/React.
 *
 * Usage:
 *   const token = useAuthStore((s) => s.token);
 *   const { login, logout } = useAuthStore();
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import { apiRequest } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { setSessionTokenProvider } from '../session/sessionProvider';

// ─── Persistence helpers (H2) ─────────────────────────────────────────────
// Web: localStorage (synchronous, simple).
// Native: lazy-load @react-native-async-storage/async-storage.
// Falls back gracefully if storage is unavailable.

const STORAGE_KEY = 'cropvision_auth';

const storage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      // Dynamic import to avoid hard dependency if not installed
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
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
      // Silent fail — persistence is best-effort
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
      // Silent fail
    }
  },
};

const useAuthStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  user: null,
  token: null,
  isLoading: false,
  isRestoring: true, // [H2] true until rehydrate completes
  error: null,

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * [H2] Restore session from persistent storage on app start.
   * Call once in the root layout's useEffect.
   */
  rehydrate: async () => {
    try {
      const raw = await storage.getItem(STORAGE_KEY);
      if (raw) {
        const { user, token } = JSON.parse(raw);
        if (user && token) {
          set({ user, token, isRestoring: false });
          return;
        }
      }
    } catch {
      // Corrupted storage — clear it
      await storage.removeItem(STORAGE_KEY);
    }
    set({ isRestoring: false });
  },

  /**
   * Login: POST /api/auth/login
   * On success, stores user + token in state AND persists to storage.
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        const { user, token } = data.data;
        set({ user, token, isLoading: false, error: null });
        // [H2] Persist session
        await storage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
        return { success: true };
      } else {
        set({ isLoading: false, error: data.message });
        return { success: false, message: data.message };
      }
    } catch (err) {
      // [H1] apiRequest now throws on non-2xx; surface the server message
      const message = err.message || 'Không thể kết nối đến máy chủ.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  /**
   * Register: POST /api/auth/register
   */
  register: async (fullName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
      });

      set({ isLoading: false });

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        set({ error: data.message });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = err.message || 'Không thể kết nối đến máy chủ.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  /**
   * Verify OTP: POST /api/auth/verify
   */
  verifyEmail: async (email, otpCode) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.auth.verify, {
        method: 'POST',
        body: JSON.stringify({ email, otpCode }),
      });

      set({ isLoading: false });

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        set({ error: data.message });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = err.message || 'Không thể kết nối đến máy chủ.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  /**
   * Logout: clears all session state AND removes from persistent storage.
   */
  logout: async () => {
    set({ user: null, token: null, error: null });
    // [H2] Clear persisted session
    await storage.removeItem(STORAGE_KEY);
  },

  /**
   * Clear any auth error message.
   */
  clearError: () => set({ error: null }),
}));

setSessionTokenProvider(() => useAuthStore.getState().token);

export { useAuthStore };
