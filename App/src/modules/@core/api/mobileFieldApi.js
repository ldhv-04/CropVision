/**
 * Mobile Field API Client — Task 1: Station-to-Mobile Bridge
 *
 * Typed API functions for mobile user to interact with assigned fields
 * and published polygon-only zone maps.
 *
 * DEPENDENCY NOTE:
 * - These APIs expose ONLY published zone maps from field_zone_maps table.
 * - Draft sub_zones from the station zone editor are NEVER returned.
 * - No satellite tiles, no MapLibre, no tile URLs in responses.
 * - Responses are lightweight polygon GeoJSON for mobile rendering.
 *
 * FUTURE DEPENDENCY NOTE (cultivation data):
 * - Crop/cultivation data (Task 3) will be stored in separate tables.
 * - These API functions will be extended to support cultivation forms.
 */

import { apiClient } from './client'; // Use the project's existing API client

/**
 * Fetch all fields assigned to the authenticated mobile user.
 * Only returns fields that have been published (zones_published_at IS NOT NULL).
 *
 * @returns {Promise<{ fields: Array<{
 *   id: string,
 *   name: string,
 *   code: string|null,
 *   area: number|null,
 *   zonesCount: number,
 *   latestMapVersion: number,
 *   publishedAt: string|null
 * }> }>}
 */
export async function getMyFields() {
  const response = await apiClient.get('/mobile/fields');
  return response.data;
}

/**
 * Fetch the latest published polygon-only zone map for a field.
 * The authenticated user must be the field owner.
 *
 * @param {string} fieldId - UUID of the field
 * @returns {Promise<{
 *   field: {
 *     id: string,
 *     name: string,
 *     code: string|null,
 *     area: number|null
 *   },
 *   map: {
 *     type: 'polygon-only',
 *     version: number,
 *     publishedAt: string,
 *     boundary: GeoJSON.Polygon|null,
 *     zones: Array<{
 *       id: number,
 *       code: string|null,
 *       name: string|null,
 *       area: number|null,
 *       geometry: GeoJSON.Polygon
 *     }>
 *   }
 * }>}
 */
export async function getFieldZoneMap(fieldId) {
  const response = await apiClient.get(`/mobile/fields/${fieldId}/zone-map`);
  return response.data;
}