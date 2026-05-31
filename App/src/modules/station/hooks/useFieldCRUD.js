/**
 * useFieldCRUD — Hook for Field CRUD API operations.
 *
 * Handles: fetch fields, create, update, delete (soft), restore.
 * Connects to backend /api/fields endpoints via centralized @core/api client.
 */

import { useCallback } from 'react';
import useFieldGISStore from '../stores/fieldGISStore';
import api from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

export default function useFieldCRUD() {
  const {
    setFields,
    addField,
    updateField: updateFieldInStore,
    removeField,
    setLoading,
    setError,
    showToast,
  } = useFieldGISStore();

  // Fetch all fields
  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(ENDPOINTS.fields.list);
      const fieldsData = res.data || [];
      console.log('[FIELD_FLOW] field list loaded', fieldsData.length);
      if (fieldsData.length > 0) {
        const sample = fieldsData[0];
        console.log('[FIELD_FLOW] field item geometry', {
          id: sample.id,
          hasGeometry: Boolean(sample.geometry || sample.boundary || sample.coordinates),
          geometryType: sample.boundary?.type,
          boundaryIsString: typeof sample.boundary === 'string',
        });
      }
      setFields(fieldsData);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load fields', 'error');
    } finally {
      setLoading(false);
    }
  }, [setFields, setLoading, setError, showToast]);

  // Create field
  const createField = useCallback(
    async (fieldData) => {
      try {
        console.log('[FIELD_FLOW] create payload', {
          hasBoundary: Boolean(fieldData.boundary),
          boundaryType: fieldData.boundary?.type,
          name: fieldData.name,
        });
        const res = await api.post(ENDPOINTS.fields.create, fieldData);
        console.log('[FIELD_FLOW] save response', {
          id: res.data?.id,
          hasBoundary: Boolean(res.data?.boundary),
          boundaryType: res.data?.boundary?.type,
          boundaryIsString: typeof res.data?.boundary === 'string',
        });
        addField(res.data);
        showToast('Field created successfully', 'success');
        return res.data;
      } catch (err) {
        showToast(`Create failed: ${err.message}`, 'error');
        throw err;
      }
    },
    [addField, showToast]
  );

  // Update field
  const updateField = useCallback(
    async (id, fieldData) => {
      try {
        const res = await api.put(ENDPOINTS.fields.update(id), fieldData);
        updateFieldInStore(id, res.data);
        showToast('Field updated', 'success');
        return res.data;
      } catch (err) {
        showToast(`Update failed: ${err.message}`, 'error');
        throw err;
      }
    },
    [updateFieldInStore, showToast]
  );

  // Delete field (soft delete)
  const deleteField = useCallback(
    async (id) => {
      try {
        await api.delete(ENDPOINTS.fields.delete(id));
        removeField(id);
        showToast('Field moved to trash', 'success', 5000);
      } catch (err) {
        showToast(`Delete failed: ${err.message}`, 'error');
        throw err;
      }
    },
    [removeField, showToast]
  );

  // Restore field from trash
  const restoreField = useCallback(
    async (id) => {
      try {
        const res = await api.patch(ENDPOINTS.fields.restore(id));
        showToast('Field restored', 'success');
        return res.data;
      } catch (err) {
        showToast(`Restore failed: ${err.message}`, 'error');
        throw err;
      }
    },
    [showToast]
  );

  // Fetch trashed fields
  const fetchTrash = useCallback(async () => {
    try {
      const res = await api.get(ENDPOINTS.fields.trash);
      return res.data || [];
    } catch (err) {
      showToast('Failed to load trash', 'error');
      return [];
    }
  }, [showToast]);

  // Permanently delete
  const permanentDelete = useCallback(
    async (id) => {
      try {
        await api.delete(ENDPOINTS.fields.permanent(id));
        showToast('Field permanently deleted', 'success');
      } catch (err) {
        showToast(`Delete failed: ${err.message}`, 'error');
        throw err;
      }
    },
    [showToast]
  );

  return {
    fetchFields,
    createField,
    updateField,
    deleteField,
    restoreField,
    fetchTrash,
    permanentDelete,
  };
}