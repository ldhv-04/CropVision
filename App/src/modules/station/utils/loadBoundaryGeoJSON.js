/**
 * loadBoundaryGeoJSON.js — Load and validate GeoJSON boundaries from static public assets.
 *
 * Loads boundary files from the Expo Web public directory (App/public/map-data/processed/).
 * Uses relative URLs so the browser fetches from the same origin as the app (e.g. localhost:8081).
 *
 * File locations:
 * - App/public/map-data/processed/province.boundaries.geojson
 * - App/public/map-data/processed/district.boundaries.geojson (may not exist yet)
 * - App/public/map-data/processed/ward.boundaries.simplified.geojson
 */

/**
 * Safely fetches a boundary GeoJSON layer from the static public assets.
 *
 * @param {string} layerKey - Key representing the layer e.g. 'province', 'district', 'ward'
 * @param {string} relativePath - Path to the file relative to /map-data/
 * @returns {Promise<object|null>} FeatureCollection or null
 */
export async function loadBoundaryGeoJSON(layerKey, relativePath) {
  // Build a relative URL — fetches from same origin as the app (no backend host)
  const url = `/map-data/${relativePath}`;

  console.log("[BOUNDARY_DEBUG] Loading boundary layer:", layerKey);
  console.log("[BOUNDARY_DEBUG] Boundary URL:", url);

  try {
    const response = await fetch(url);
    console.log("[BOUNDARY_DEBUG] Fetch status:", response.status, "for", layerKey);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} - Status ${response.status}`);
    }

    const geojson = await response.json();

    // Basic structure validation
    if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
      throw new Error("Invalid GeoJSON: Must be a FeatureCollection");
    }

    const featureCount = geojson.features.length;

    // Collect geometry types present
    const geometryTypesSet = new Set();
    geojson.features.forEach(f => {
      if (f.geometry && f.geometry.type) {
        geometryTypesSet.add(f.geometry.type);
      }
    });
    const geometryTypes = Array.from(geometryTypesSet);

    console.log("[BOUNDARY_DEBUG] Boundary loaded successfully:", {
      layerKey,
      featureCount,
      geometryTypes,
    });

    return geojson;
  } catch (error) {
    console.error("[BOUNDARY_ERROR] Failed to load boundary GeoJSON", {
      layerKey,
      url,
      error: error.message,
    });
    console.warn("[BOUNDARY_WARN] Boundary layer skipped:", layerKey);
    return null;
  }
}