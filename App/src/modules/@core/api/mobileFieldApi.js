/**
 * Mobile Field API Client — Station-to-Mobile Bridge
 *
 * Typed API functions for mobile user to interact with assigned fields
 * and published polygon-only zone maps.
 */

import api from './apiClient';

/**
 * Fetch all fields assigned to the authenticated mobile user.
 * Only returns fields that have been published (zones_published_at IS NOT NULL).
 */
export async function getMyFields() {
  const response = await api.get('/api/mobile/fields');
  return response?.data || response;
}

/**
 * Fetch the latest published polygon-only zone map for a field.
 * The authenticated user must be the field owner.
 */
export async function getFieldZoneMap(fieldId) {
  const response = await api.get(`/api/mobile/fields/${fieldId}/zone-map`);
  return response?.data || response;
}
