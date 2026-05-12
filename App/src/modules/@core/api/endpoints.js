/**
 * API Endpoints — Layer 1 Core
 *
 * Typed route builders. All API paths live here.
 * Import from this file instead of writing strings inline.
 */

export const ENDPOINTS = {
  // Auth
  auth: {
    login:    '/api/auth/login',
    register: '/api/auth/register',
    verify:   '/api/auth/verify',
  },

  // Inference
  inference: {
    analyze: '/api/analyze',
    samples: '/api/samples',
  },

  // Admin
  admin: {
    summary:      '/api/admin/summary',
    users:        '/api/admin/users',
    userRole:     (id) => `/api/admin/users/${id}/role`,
    deleteUser:   (id) => `/api/admin/users/${id}`,
    samples:      '/api/admin/samples',
    deleteSample: (id) => `/api/admin/samples/${id}`,
  },

  // Chat (9Router AI)
  chat: {
    sessions:       '/api/chat/sessions',
    session:        (id) => `/api/chat/sessions/${id}`,
    renameSession:  (id) => `/api/chat/sessions/${id}`,
    deleteSession:  (id) => `/api/chat/sessions/${id}`,
    sendMessage:    (id) => `/api/chat/sessions/${id}/messages`,
    consult:        (id) => `/api/chat/sessions/${id}/consult`,  // Consult with YOLO detection context
    searchDiseases: '/api/chat/diseases/search',                 // Search diseases by keyword
  },

  // Health
  health: '/api/health',
};
