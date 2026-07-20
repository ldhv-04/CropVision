/**
 * useZoneEditor — Hook for Management Zone Editor operations.
 *
 * Handles: fetch zones, create, update, delete, validate, publish.
 * Used by the Zone Editor screen for spatial zone management.
 */

import { useState, useCallback } from 'react';
import api from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

const OWNER_REQUIRED_MESSAGE = 'Field must be assigned to an owner before publishing.';
const getOwnerUserId = (field) => field?.owner_user_id || field?.ownerUserId || null;
const getErrorPayload = (err) => err?.data || err?.response?.data || err;

const applyCommittedPublicationToField = (field, publication) => field ? {
  ...field,
  zones_published_at: publication?.publishedAt || publication?.published_at || field.zones_published_at,
  zone_map_version: publication?.version || field.zone_map_version,
} : field;

export default function useZoneEditor(fieldId) {
  const [zones, setZones] = useState([]);
  const [parentField, setParentField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastCommittedPublication, setLastCommittedPublication] = useState(null);

  // Fetch zones for a field
  const fetchZones = useCallback(async () => {
    if (!fieldId) {
      console.warn('[ZoneEditor] fetchZones called without fieldId');
      return { field: null, zones: [] };
    }
    setIsLoading(true);
    try {
      const res = await api.get(ENDPOINTS.zones.list(fieldId));

      // Normalize response — API returns { success, data: { field, zones } }
      // apiClient already parses JSON and returns the full response body
      const payload = res?.data || res;
      const field = payload?.field || null;
      const zoneList = Array.isArray(payload?.zones) ? payload.zones : [];

      setParentField(field);
      setZones(zoneList);
      setHasUnsavedChanges(false);
      return { field, zones: zoneList };
    } catch (err) {
      console.error('[ZoneEditor] fetchZones error:', {
        status: err.status || err.response?.status,
        errorMessage: err.data?.message || err.message,
      });
      // Don't throw — treat as empty zones, show error state
      setZones([]);
      return { field: null, zones: [] };
    } finally {
      setIsLoading(false);
    }
  }, [fieldId]);

  // Create a new zone
  const createZone = useCallback(async (zoneData) => {
    try {
      const res = await api.post(ENDPOINTS.zones.create(fieldId), zoneData);
      const newZone = res?.data || res;
      setZones((prev) => [...prev, newZone]);
      setHasUnsavedChanges(true);
      return newZone;
    } catch (err) {
      console.error('[ZoneEditor] createZone error:', err.message);
      throw err;
    }
  }, [fieldId]);

  // Update a zone (geometry, code, name)
  const updateZone = useCallback(async (zoneId, zoneData) => {
    try {
      const res = await api.patch(ENDPOINTS.zones.update(fieldId, zoneId), zoneData);
      const updated = res?.data || res;
      setZones((prev) => prev.map((z) => (String(z.id) === String(zoneId) ? updated : z)));
      setHasUnsavedChanges(true);
      return updated;
    } catch (err) {
      console.error('[ZoneEditor] updateZone error:', err.message);
      throw err;
    }
  }, [fieldId]);

  // Delete a zone
  const deleteZone = useCallback(async (zoneId) => {
    try {
      await api.delete(ENDPOINTS.zones.delete(fieldId, zoneId));
      setZones((prev) => prev.filter((z) => String(z.id) !== String(zoneId)));
      setHasUnsavedChanges(true);
    } catch (err) {
      console.error('[ZoneEditor] deleteZone error:', err.message);
      throw err;
    }
  }, [fieldId]);

  // Validate all zones
  const validateZones = useCallback(async () => {
    try {
      const res = await api.post(ENDPOINTS.zones.validate(fieldId));
      const result = res?.data || res;
      setValidationResult(result);
      return result;
    } catch (err) {
      console.error('[ZoneEditor] validateZones error:', err.message);
      // Extract validation errors from 400 response
      if (err.data || err.response?.data) {
        return getErrorPayload(err);
      }
      throw err;
    }
  }, [fieldId]);

  // Assign registered mobile owner by email. Email is lookup-only; backend stores owner_user_id.
  const assignFieldOwner = useCallback(async (email) => {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      throw { message: 'Enter a registered user email.' };
    }

    if (!fieldId) {
      throw { message: 'Field id is required before assigning an owner.' };
    }

    try {
      const res = await api.post(ENDPOINTS.fields.assignOwner(fieldId), { email: normalizedEmail });
      const payload = res?.field || res?.data?.field || res?.data || res;
      const ownerUserId = payload?.owner_user_id || payload?.ownerUserId || null;
      const ownerEmail = payload?.owner_email || payload?.ownerEmail || payload?.owner_email_snapshot || normalizedEmail;

      const updatedField = {
        ...(parentField || {}),
        id: payload?.id || parentField?.id || fieldId,
        name: payload?.name || parentField?.name || null,
        code: payload?.code ?? parentField?.code ?? null,
        owner_user_id: ownerUserId,
        ownerUserId,
        owner_email: ownerEmail,
        ownerEmail,
        owner_email_snapshot: ownerEmail,
      };

      setParentField(updatedField);
      return updatedField;
    } catch (err) {
      const payload = getErrorPayload(err);
      throw payload;
    }
  }, [fieldId, parentField]);

  // Publish zone map
  const publishZones = useCallback(async () => {
    const ownerUserId = getOwnerUserId(parentField);

    if (!ownerUserId) {
      throw {
        message: OWNER_REQUIRED_MESSAGE,
        errors: [{ type: 'NO_OWNER', message: OWNER_REQUIRED_MESSAGE }],
      };
    }

    try {
      const res = await api.post(ENDPOINTS.zones.publish(fieldId));
      const payload = res?.data || res;
      setHasUnsavedChanges(false);
      setLastCommittedPublication(payload);
      setParentField((prev) => applyCommittedPublicationToField(prev, payload));
      return payload;
    } catch (err) {
      const payload = getErrorPayload(err);
      console.error('[ZoneEditor] publishZones error:', payload?.message || err.message);
      throw payload;
    }
  }, [fieldId, parentField, zones.length]);

  // Auto-generate next zone code
  const getNextZoneCode = useCallback(() => {
    if (!parentField) return 'Z1';
    const base = parentField.code || 'F';
    const existingCodes = new Set(zones.map((z) => z.code).filter(Boolean));
    let counter = 1;
    let candidate = `${base}${counter}`;
    while (existingCodes.has(candidate)) {
      counter++;
      candidate = `${base}${counter}`;
    }
    return candidate;
  }, [parentField, zones]);

  return {
    zones,
    setZones,
    parentField,
    isLoading,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    lastCommittedPublication,
    validationResult,
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
    validateZones,
    assignFieldOwner,
    publishZones,
    getNextZoneCode,
  };
}
