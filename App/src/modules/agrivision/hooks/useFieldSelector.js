import { useMemo, useCallback } from 'react';
import useFieldMapStore from '../stores/fieldMapStore';
import useFieldStore from '../stores/fieldStore';

/**
 * useFieldSelector — Provides field/zone selection data for dropdowns.
 *
 * Returns formatted lists of fields and zones for the FieldSelector component.
 */
export default function useFieldSelector() {
  const { selectedFieldId, selectedZoneId, selectField, selectZone } = useFieldMapStore();
  const { fields, currentZones } = useFieldStore();

  // Format fields for dropdown
  const fieldOptions = useMemo(() => {
    return fields.map((f) => ({
      value: f.id,
      label: f.name || `Field ${f.id}`,
      cropType: f.crop_type,
      area: f.area,
    }));
  }, [fields]);

  // Format zones for dropdown
  const zoneOptions = useMemo(() => {
    return currentZones.map((z) => ({
      value: z.id,
      label: z.name || z.crop_type || `Zone ${z.id}`,
      status: z.status,
      cropType: z.crop_type,
    }));
  }, [currentZones]);

  // Current selections
  const selectedField = useMemo(() => {
    return fields.find((f) => f.id === selectedFieldId) || null;
  }, [fields, selectedFieldId]);

  const selectedZone = useMemo(() => {
    return currentZones.find((z) => z.id === selectedZoneId) || null;
  }, [currentZones, selectedZoneId]);

  // Status counts for badges
  const statusCounts = useMemo(() => {
    const counts = { HEALTHY: 0, WARNING: 0, INFECTED: 0, total: currentZones.length };
    currentZones.forEach((z) => {
      if (counts[z.status] !== undefined) counts[z.status]++;
    });
    return counts;
  }, [currentZones]);

  // Handlers
  const handleFieldChange = useCallback((fieldId) => {
    selectField(fieldId);
  }, [selectField]);

  const handleZoneChange = useCallback((zoneId) => {
    selectZone(zoneId);
  }, [selectZone]);

  // Breadcrumb path
  const breadcrumb = useMemo(() => {
    const items = [{ label: 'Fields', onPress: () => selectField(null) }];
    if (selectedField) {
      items.push({ label: selectedField.name || `Field ${selectedField.id}`, onPress: () => selectZone(null) });
    }
    if (selectedZone) {
      items.push({ label: selectedZone.name || selectedZone.crop_type || `Zone ${selectedZone.id}` });
    }
    return items;
  }, [selectedField, selectedZone, selectField, selectZone]);

  return {
    // Options for dropdowns
    fieldOptions,
    zoneOptions,

    // Current selections
    selectedField,
    selectedZone,
    selectedFieldId,
    selectedZoneId,

    // Status info
    statusCounts,

    // Navigation
    breadcrumb,

    // Actions
    handleFieldChange,
    handleZoneChange,
  };
}