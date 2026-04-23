/**
 * useAuthStore — Layer 1 Core
 *
 * Zustand store replacing the old AuthContext.
 * Manages session state (user + token) for all 3 platforms.
 *
 * NO platform-specific imports. Pure JS/React.
 *
 * Usage:
 *   const token = useAuthStore((s) => s.token);
 *   const { login, logout } = useAuthStore();
 */

import { create } from 'zustand';
import { apiRequest } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const useAuthStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Login: POST /api/auth/login
   * On success, stores user + token in state.
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        set({
          user: data.data.user,
          token: data.data.token,
          isLoading: false,
          error: null,
        });
        return { success: true };
      } else {
        set({ isLoading: false, error: data.message });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = 'Không thể kết nối đến máy chủ.';
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
      const message = 'Không thể kết nối đến máy chủ.';
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
      const message = 'Không thể kết nối đến máy chủ.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  /**
   * Logout: clears all session state.
   */
  logout: () => set({ user: null, token: null, error: null }),

  /**
   * Clear any auth error message.
   */
  clearError: () => set({ error: null }),
}));

export { useAuthStore };
