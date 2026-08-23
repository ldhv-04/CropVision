/**
 * FieldExplorerPanel — Tactical Cadastral Explorer Panel
 *
 * Direction 3: Tactical Agronomy Command
 */

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import FieldExplorerHeader from './FieldExplorerHeader';
import FieldExplorerSearch from './FieldExplorerSearch';
import FieldExplorerFilters from './FieldExplorerFilters';
import FieldExplorerList from './FieldExplorerList';
import { extractPolygonCoords, calculateCentroid } from '../../../utils/fieldGeometry';
import { FIELD_FOCUS_ZOOM } from '../../../config/mapConfig';
import { selectListFields } from '../../../stores/fieldGISStore';
import { TACTICAL_THEME } from '../../../constants/tacticalTheme';

export default function FieldExplorerPanel({
  fields,
  selectedFieldId,
  hoveredFieldId,
  searchQuery,
  explorerCollapsed,
  filters,
  setSelectedField,
  setHoveredField,
  setSearchQuery,
  toggleExplorer,
  setFilter,
  onFlyToField,
}) {
  const panelRef = useRef(null);

  const explorerFilteredFields = useMemo(
    () => selectListFields({ fields, searchQuery, filters }),
    [fields, searchQuery, filters.status, filters.cropType]
  );

  const handleSelectField = useCallback(
    (fieldId) => {
      setSelectedField(fieldId);
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

  const handleHoverField = useCallback(
    (fieldId) => {
      setHoveredField(fieldId);
    },
    [setHoveredField]
  );

  const handleSearchChange = useCallback(
    (query) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      setFilter(key, value);
    },
    [setFilter]
  );

  if (explorerCollapsed) {
    return (
      <FieldExplorerHeader isCollapsed={true} onToggle={toggleExplorer} />
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: TACTICAL_THEME.bgPanelSolid,
        borderRight: `1px solid ${TACTICAL_THEME.border}`,
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
