/**
 * useAdminStore — Admin Module / Layer 1: Core
 *
 * Station/Admin support store replacing local state and inline fetch calls in
 * the old AdminPanel.
 */

import { create } from 'zustand';
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

const useAdminStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  summary: null,
  users: [],
  samples: [],
  isLoading: true,
  isRefreshing: false,
  error: null,
  actionKey: null, // "role-userId" or "delete-sample-id" etc.

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Load all admin data (summary, users, samples) */
  loadAdminData: async (token, useRefreshState = false) => {
    if (!token) return;

    if (useRefreshState) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const [summaryRes, usersRes, samplesRes] = await Promise.all([
        apiRequest(ENDPOINTS.admin.summary, {}, token),
        apiRequest(ENDPOINTS.admin.users, {}, token),
        apiRequest(ENDPOINTS.admin.samples, {}, token),
      ]);

      set({
        summary: summaryRes.data,
        users: usersRes.data,
        samples: samplesRes.data,
      });
    } catch (err) {
      set({ error: err.message || 'Không thể tải dữ liệu admin.' });
    } finally {
      if (useRefreshState) {
        set({ isRefreshing: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  /** Toggle User Role */
  toggleUserRole: async (token, user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    set({ actionKey: `role-${user.id}`, error: null });

    try {
      await apiRequest(ENDPOINTS.admin.userRole(user.id), {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      }, token);
      
      // Update local state without re-fetching everything
      set((state) => ({
        users: state.users.map((u) => u.id === user.id ? { ...u, role: nextRole } : u)
      }));
    } catch (err) {
      set({ error: err.message || 'Cập nhật role thất bại.' });
      throw err;
    } finally {
      set({ actionKey: null });
    }
  },

  /** Delete User */
  deleteUser: async (token, userId) => {
    set({ actionKey: `delete-user-${userId}`, error: null });
    try {
      await apiRequest(ENDPOINTS.admin.deleteUser(userId), { method: 'DELETE' }, token);
      
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId)
      }));
    } catch (err) {
      set({ error: err.message || 'Xóa user thất bại.' });
      throw err;
    } finally {
      set({ actionKey: null });
    }
  },

  /** Delete Sample */
  deleteSample: async (token, sampleId) => {
    set({ actionKey: `delete-sample-${sampleId}`, error: null });
    try {
      await apiRequest(ENDPOINTS.admin.deleteSample(sampleId), { method: 'DELETE' }, token);
      
      set((state) => ({
        samples: state.samples.filter((s) => s.id !== sampleId)
      }));
    } catch (err) {
      set({ error: err.message || 'Xóa mẫu vật thất bại.' });
      throw err;
    } finally {
      set({ actionKey: null });
    }
  },

  clearError: () => set({ error: null }),
}));

export { useAdminStore };
