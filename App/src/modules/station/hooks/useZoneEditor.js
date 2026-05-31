/**
 * useZoneEditor — Hook for Management Zone Editor operations.
 *
 * Handles: fetch zones, create, update, delete, validate, publish.
 * Used by the Zone Editor screen for spatial zone management.
 */

import { useState, useCallback } from 'react';
import api from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

export default function useZoneEditor(fieldId) {
  const [zones, setZones] = useState([]);
  const [parentField, setParentField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      // Enhanced error logging for debugging
      console.error('[ZoneEditor] fetchZones error:', {
        fieldId,
        status: err.status || err.response?.status,
        message: err.data?.message || err.message,
        url: err.config?.url,
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
      if (err.response?.data) {
        return err.response.data;
      }
      throw err;
    }
  }, [fieldId]);

  // Publish zone map
  const publishZones = useCallback(async () => {
    try {
      const res = await api.post(ENDPOINTS.zones.publish(fieldId));
      setHasUnsavedChanges(false);
      // Update zone statuses locally
      setZones((prev) => prev.map((z) => ({ ...z, zone_status: 'published' })));
      return res.data;
    } catch (err) {
      console.error('[ZoneEditor] publishZones error:', err.message);
      if (err.response?.data) {
        throw err.response.data;
      }
      throw err;
    }
  }, [fieldId]);

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
    validationResult,
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
    validateZones,
    publishZones,
    getNextZoneCode,
  };
}