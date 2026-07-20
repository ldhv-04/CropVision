/**
 * mapConfig.js — Centralized zoom and camera constants for Station Map.
 *
 * Single source of truth for all zoom limits across the application.
 * Import from this file instead of defining local constants.
 *
 * Usage:
 *   import { MAP_MIN_ZOOM, MAP_MAX_ZOOM, FIELD_FOCUS_ZOOM, clampZoom } from '../config/mapConfig';
 */

// ── Zoom Policy ────────────────────────────────────────────────

/** Minimum zoom level — below this, the map shows too little detail. */
export const MAP_MIN_ZOOM = 5;

/** Maximum camera zoom level — enforced by MapLibre map instance. */
export const MAP_MAX_ZOOM = 18;

/** Maximum zoom the raster tile source will request from the provider.
 *  OSM tiles are available up to z=19. Set to 19 so source fetches tiles
 *  even when map is at zoom 18. This prevents blank tiles at the boundary. */
export const SOURCE_MAX_ZOOM = 19;

/** Default zoom when focusing on a single field (fitBounds / flyTo).
 *  Must be ≤ MAP_MAX_ZOOM to avoid camera overshoot. */
export const FIELD_FOCUS_ZOOM = 16;

// ── Helpers ────────────────────────────────────────────────────

/**
 * Clamp a zoom value to the safe [MAP_MIN_ZOOM, MAP_MAX_ZOOM] range.
 * @param {number} zoom
 * @returns {number}
 */
export function clampZoom(zoom) {
  return Math.max(MAP_MIN_ZOOM, Math.min(zoom, MAP_MAX_ZOOM));
}