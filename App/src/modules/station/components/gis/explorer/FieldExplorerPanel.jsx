/**
 * FieldExplorerPanel — Main collapsible explorer panel with two-way map synchronization.
 *
 * Orchestrates:
 * - Header (collapse/expand)
 * - Search (debounced 300ms)
 * - Filters (status, crop type)
 * - List (scrollable field items)
 *
 * Two-Way Sync:
 * - List → Map: click field item → setSelectedField → flyTo + highlight + popup
 * - Map → List: click polygon → setSelectedField → scroll list item into view
 *
 * Architecture:
 * - Single Source of Truth: Zustand store (no local selection state)
 * - Search/filter computed via useMemo (no store duplication)
 * - flyTo called via mapRef exposure pattern (imperative, not reactive)
 *
 * Debug logs: [Explorer], [MapSync]
 */

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import FieldExplorerHeader from './FieldExplorerHeader';
import FieldExplorerSearch from './FieldExplorerSearch';
import FieldExplorerFilters from './FieldExplorerFilters';
import FieldExplorerList from './FieldExplorerList';
import { extractPolygonCoords, calculateCentroid } from '../../../utils/fieldGeometry';
import { FIELD_FOCUS_ZOOM } from '../../../config/mapConfig';
import { selectListFields } from '../../../stores/fieldGISStore';

export default function FieldExplorerPanel({
  // Store state (passed as props from FieldsPage to avoid direct store coupling in UI)
  fields,
  selectedFieldId,
  hoveredFieldId,
  searchQuery,
  explorerCollapsed,
  filters,
  // Store actions
  setSelectedField,
  setHoveredField,
  setSearchQuery,
  toggleExplorer,
  setFilter,
  // Map flyTo callback (imperative bridge to MapLibre)
  onFlyToField,
}) {
  const panelRef = useRef(null);

  // ── Debug: Mount log ────────────────────────────────────────
  useEffect(() => {
    console.log('[Explorer] Mounted');
    return () => {
      // Cleanup on unmount
    };
  }, []);

  // ── Search + Filter → filtered fields ───────────────────────
  const explorerFilteredFields = useMemo(
    () => selectListFields({ fields, searchQuery, filters }),
    [fields, searchQuery, filters.status, filters.cropType]
  );

  // ── List → Map: Handle field selection from list ────────────
  const handleSelectField = useCallback(
    (fieldId) => {
      console.log('[Explorer] Field selected:', fieldId);
      console.log('[MapSync] flyTo field:', fieldId);
      setSelectedField(fieldId);

      // Imperatively fly to the field on the map
      if (onFlyToField) {
        const field = fields.find((f) => f.id === fieldId);
        if (field) {
          const coords = extractPolygonCoords(field.boundary);
          if (coords.length > 0) {
            const centroid = calculateCentroid(coords);
            onFlyToField(centroid, FIELD_FOCUS_ZOOM);
          }
        }
      }
    },
    [fields, setSelectedField, onFlyToField]
  );

  // ── Hover handlers ──────────────────────────────────────────
  const handleHoverField = useCallback(
    (fieldId) => {
      setHoveredField(fieldId);
    },
    [setHoveredField]
  );

  // ── Search change handler ───────────────────────────────────
  const handleSearchChange = useCallback(
    (query) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  // ── Filter change handler ───────────────────────────────────
  const handleFilterChange = useCallback(
    (key, value) => {
      setFilter(key, value);
    },
    [setFilter]
  );

  // ── Collapsed state ─────────────────────────────────────────
  if (explorerCollapsed) {
    return (
      <FieldExplorerHeader isCollapsed={true} onToggle={toggleExplorer} />
    );
  }

  // ── Expanded state ──────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      style={{
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #E0E0E0',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
      data-testid="field-explorer-panel"
    >
      <FieldExplorerHeader isCollapsed={false} onToggle={toggleExplorer} />
      <FieldExplorerSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
      <FieldExplorerFilters
        fields={fields}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      <FieldExplorerList
        fields={explorerFilteredFields}
        selectedFieldId={selectedFieldId}
        hoveredFieldId={hoveredFieldId}
        onSelectField={handleSelectField}
        onHoverField={handleHoverField}
      />
    </div>
  );
}
