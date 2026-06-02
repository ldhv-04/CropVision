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
    summary:            '/api/admin/summary',
    statsEnhanced:      '/api/admin/stats/enhanced',
    statsTimeline:      (days) => `/api/admin/stats/timeline?days=${days || 30}`,
    statsDiseases:      '/api/admin/stats/diseases',
    users:              '/api/admin/users',
    userRole:           (id) => `/api/admin/users/${id}/role`,
    deleteUser:         (id) => `/api/admin/users/${id}`,
    samples:            '/api/admin/samples',
    deleteSample:       (id) => `/api/admin/samples/${id}`,
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

  // Fields (AgriVision + Station GIS)
  fields: {
    list:       '/api/fields',
    create:     '/api/fields',
    detail:     (id) => `/api/fields/${id}`,
    update:     (id) => `/api/fields/${id}`,
    delete:     (id) => `/api/fields/${id}`,
    restore:    (id) => `/api/fields/${id}/restore`,
    permanent:  (id) => `/api/fields/${id}/permanent`,
    trash:      '/api/fields/trash',
    generatePolygon: '/api/fields/generate-polygon',
    activities: (id) => `/api/fields/${id}/activities`,
    addActivity: (id) => `/api/fields/${id}/activities`,
    zonesSummary: (id) => `/api/fields/${id}/zones/summary`,
  },

  // Weather (AgriVision)
  weather: {
    current: (lat, lon) => `/api/weather?lat=${lat}&lon=${lon}`,
  },

  // Disease Encyclopedia
  diseases: {
    list:         '/api/diseases',
    detail:       (id) => `/api/diseases/${id}`,
    cropTypes:    '/api/diseases/crops/list',
    pesticides:   '/api/diseases/pesticides/list',
    symptomTree:  '/api/diseases/symptoms/tree',
  },

  // Alerts (Station → Field)
  alerts: {
    create:       '/api/alerts',
    active:       (lat, lng) => lat && lng ? `/api/alerts?lat=${lat}&lng=${lng}` : '/api/alerts',
    all:          '/api/alerts/all',
    suggestions:  (days, minDet) => `/api/alerts/suggestions?days=${days || 7}&min_detections=${minDet || 5}`,
    metrics:      (id) => `/api/alerts/${id}/metrics`,
    acknowledge:  (id) => `/api/alerts/${id}/acknowledge`,
    deactivate:   (id) => `/api/alerts/${id}/deactivate`,
  },

  // Epidemics & Outbreaks (Geo-Spatial and Forecasting)
  epidemic: {
    report:             '/api/epidemic/report',
    alerts:             '/api/epidemic/alerts',
    alertRead:          (id) => `/api/epidemic/alerts/${id}/read`,
    reportResolve:      (id) => `/api/epidemic/reports/${id}/resolve`,
    simulate:           '/api/epidemic/simulate',
    outbreaks:          '/api/epidemic/outbreaks',
    outbreakDetail:     (id) => `/api/epidemic/outbreaks/${id}`,
  },

  // Sub-zones (legacy)
  subzones: {
    list:       (fieldId) => `/api/fields/${fieldId}/subzones`,
    create:     (fieldId) => `/api/fields/${fieldId}/subzones`,
    detail:     (id) => `/api/subzones/${id}`,
    update:     (id) => `/api/subzones/${id}`,
    delete:     (id) => `/api/subzones/${id}`,
    metrics:    (id) => `/api/subzones/${id}/metrics`,
    // NEW: Field Management Redesign endpoints
    summary:        (fieldId) => `/api/fields/${fieldId}/zones/summary`,
    timeSeries:     (id, metric, range) => `/api/subzones/${id}/metrics/timeseries?metric=${metric}&range=${range || '7d'}`,
    healthHistory:  (id) => `/api/subzones/${id}/health-history`,
  },

  // Management Zones (Station/Admin Zone Editor)
  zones: {
    list:       (fieldId) => `/api/fields/${fieldId}/zones`,
    create:     (fieldId) => `/api/fields/${fieldId}/zones`,
    update:     (fieldId, zoneId) => `/api/fields/${fieldId}/zones/${zoneId}`,
    delete:     (fieldId, zoneId) => `/api/fields/${fieldId}/zones/${zoneId}`,
    validate:   (fieldId) => `/api/fields/${fieldId}/zones/validate`,
    publish:    (fieldId) => `/api/fields/${fieldId}/zones/publish`,
  },

  // GPS Boundary Walk (mobile farmer → field perimeter mapping)
  walk: {
    start:    (fieldId) => `/api/fields/${fieldId}/walk/start`,
    status:   (fieldId, walkId) => `/api/fields/${fieldId}/walk/${walkId}`,
    points:   (fieldId, walkId) => `/api/fields/${fieldId}/walk/${walkId}/points`,
    complete: (fieldId, walkId) => `/api/fields/${fieldId}/walk/${walkId}/complete`,
  },

  // Homepage (aggregated widget data)
  homepage: {
    summary:  '/api/homepage/summary',
    diseases: (limit) => `/api/homepage/diseases?limit=${limit || 8}`,
  },

  // Mobile Field Manager (Task 1/2: Station-to-Mobile bridge)
  // DEPENDENCY NOTE: Mobile consumes only latest published zone maps.
  // Draft station zone maps are never exposed here.
  // No satellite tiles, no MapLibre — polygon-only GeoJSON.
  mobile: {
    fields:         '/api/mobile/fields',
    fieldZoneMap:   (fieldId) => `/api/mobile/fields/${fieldId}/zone-map`,
  },

  // Health
  health: '/api/health',
};
