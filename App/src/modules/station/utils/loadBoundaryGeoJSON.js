/**
 * loadBoundaryGeoJSON.js — Safe async loader for administrative boundary GeoJSON files.
 *
 * Rules:
 * - Province: lazy-load on demand (5.5MB processed) — visible by default once loaded
 * - District: lazy-load only when user enables — 10MB processed
 * - Ward: lazy-load only when user enables — 30MB simplified. Not auto-loaded.
 *
 * All files served from public/map-data/processed/ which maps to /map-data/processed/ at runtime.
 *
 * Debug logs prefixed with [BOUNDARY_DEBUG], [BOUNDARY_WARN], [BOUNDARY_ERROR].
 */

// ── Boundary Layer Config ──────────────────────────────────────
export const BOUNDARY_LAYER_CONFIG = {
  province: {
    key: 'province',
    label: 'Ranh giới Tỉnh/Thành phố',
    labelEN: 'Province Boundaries',
    icon: '🗺️',
    sourceId: 'admin-province-source',
    lineLayerId: 'admin-province-line',
    labelLayerId: 'admin-province-label',
    filePath: '/map-data/processed/province.boundaries.geojson',
    sizeMB: 5.53,
    safeForDirectLoad: true, // 5.5MB is acceptable with lazy load
    minZoom: 3,
    maxZoom: 18,
    defaultVisible: true, // Load and show by default once fetched
    lineColor: '#E65100',   // Deep orange — distinct from field green
    lineWidth: 1.5,
    lineOpacity: 0.85,
    labelKey: 'ten_tinh',
    labelMinZoom: 5,
    loadPriority: 1,
  },
  district: {
    key: 'district',
    label: 'Ranh giới Huyện/Quận',
    labelEN: 'District Boundaries',
    icon: '🔶',
    sourceId: 'admin-district-source',
    lineLayerId: 'admin-district-line',
    labelLayerId: 'admin-district-label',
    filePath: '/map-data/processed/district.boundaries.geojson',
    sizeMB: 10.03,
    safeForDirectLoad: true, // Lazy-loaded on demand
    minZoom: 7,
    maxZoom: 18,
    defaultVisible: false,
    lineColor: '#1565C0',   // Blue — distinct from province orange
    lineWidth: 1.0,
    lineOpacity: 0.75,
    labelKey: 'ten_quan',
    labelMinZoom: 9,
    loadPriority: 2,
  },
  ward: {
    key: 'ward',
    label: 'Ranh giới Xã/Phường',
    labelEN: 'Ward Boundaries',
    icon: '🔷',
    sourceId: 'admin-ward-source',
    lineLayerId: 'admin-ward-line',
    labelLayerId: 'admin-ward-label',
    filePath: '/map-data/processed/ward.boundaries.simplified.geojson',
    sizeMB: 29.81,
    safeForDirectLoad: false, // 30MB — lazy-load only, only with user intent
    minZoom: 10,
    maxZoom: 18,
    defaultVisible: false,
    lineColor: '#2E7D32',   // Green — but lighter than field polygons
    lineWidth: 0.75,
    lineOpacity: 0.65,
    labelKey: 'ten_xa',
    labelMinZoom: 12,
    loadPriority: 3,
  },
};

// ── Cache: avoid re-fetching already loaded data ───────────────
const _boundaryCache = {};

/**
 * Load a boundary GeoJSON file safely.
 * Returns a validated FeatureCollection or null on failure.
 *
 * @param {string} layerKey - 'province' | 'district' | 'ward'
 * @returns {Promise<GeoJSON.FeatureCollection|null>}
 */
export async function loadBoundaryGeoJSON(layerKey) {
  const config = BOUNDARY_LAYER_CONFIG[layerKey];
  if (!config) {
    console.error('[BOUNDARY_ERROR] Unknown boundary layer key:', layerKey);
    return null;
  }

  // Return cached data if available
  if (_boundaryCache[layerKey]) {
    console.log('[BOUNDARY_DEBUG] Using cached boundary data for:', layerKey);
    return _boundaryCache[layerKey];
  }

  console.log('[BOUNDARY_DEBUG] Starting boundary data load');
  console.log('[BOUNDARY_DEBUG] Loading boundary layer:', layerKey);
  console.log('[BOUNDARY_DEBUG] Boundary file path:', config.filePath);
  console.log('[BOUNDARY_DEBUG] Expected size MB:', config.sizeMB);

  if (!config.safeForDirectLoad && config.sizeMB > 20) {
    console.warn('[BOUNDARY_WARN] Boundary layer is large:', layerKey, config.sizeMB + 'MB — loading anyway (user-initiated)');
  }

  try {
    const response = await fetch(config.filePath);

    if (!response.ok) {
      console.error('[BOUNDARY_ERROR] HTTP error loading boundary GeoJSON', {
        layerKey,
        status: response.status,
        statusText: response.statusText,
        path: config.filePath,
      });
      return null;
    }

    const data = await response.json();

    // Validate FeatureCollection structure
    if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      console.error('[BOUNDARY_ERROR] Invalid GeoJSON FeatureCollection structure', { layerKey });
      return null;
    }

    const featureCount = data.features.length;
    const geometryTypes = [...new Set(data.features.map(f => f.geometry?.type).filter(Boolean))];

    console.log('[BOUNDARY_DEBUG] Boundary GeoJSON loaded:', layerKey);
    console.log('[BOUNDARY_DEBUG] Feature count:', featureCount);
    console.log('[BOUNDARY_DEBUG] Geometry types:', geometryTypes);

    // Cache the loaded data
    _boundaryCache[layerKey] = data;

    return data;
  } catch (error) {
    console.error('[BOUNDARY_ERROR] Failed to load boundary GeoJSON', {
      layerKey,
      path: config.filePath,
      error: error.message,
    });
    return null;
  }
}

/**
 * Clear cached boundary data for a specific key or all layers.
 * @param {string|null} layerKey - Pass null to clear all caches
 */
export function clearBoundaryCache(layerKey = null) {
  if (layerKey) {
    delete _boundaryCache[layerKey];
  } else {
    Object.keys(_boundaryCache).forEach(k => delete _boundaryCache[k]);
  }
}

/**
 * Returns an empty GeoJSON FeatureCollection.
 */
export function emptyBoundaryCollection() {
  return { type: 'FeatureCollection', features: [] };
}

/**
 * After a MapLibre style change, re-apply cached GeoJSON data to boundary sources
 * and restore correct layer visibility from adminLayers state.
 *
 * @param {object} map - The MapLibre map instance
 * @param {object} adminLayersState - { province: bool, district: bool, ward: bool }
 */
export function rehydrateBoundarySourcesFromCache(map, adminLayersState) {
  if (!map) return;

  console.log('[BOUNDARY_DEBUG] Rehydrating boundary sources from cache after style change');

  Object.entries(BOUNDARY_LAYER_CONFIG).forEach(([layerKey, config]) => {
    const cachedData = _boundaryCache[layerKey];
    const isVisible = adminLayersState?.[layerKey] ?? config.defaultVisible;
    const visibility = (isVisible && cachedData) ? 'visible' : 'none';

    if (cachedData) {
      const source = map.getSource(config.sourceId);
      if (source && source.setData) {
        source.setData(cachedData);
        console.log('[BOUNDARY_DEBUG] Rehydrated source from cache:', layerKey, cachedData.features.length, 'features');
      }
    }

    if (map.getLayer(config.lineLayerId)) {
      map.setLayoutProperty(config.lineLayerId, 'visibility', visibility);
    }
    if (map.getLayer(config.labelLayerId)) {
      map.setLayoutProperty(config.labelLayerId, 'visibility', visibility);
    }
  });

  console.log('[BOUNDARY_DEBUG] Boundary source rehydration complete');
}
