/**
 * FilterBar — Floating search and filter bar (top-center).
 *
 * Provides: Search by name, crop type filter, status filter.
 */

import React, { useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

const CROP_TYPES = ['', 'rice', 'corn', 'vegetables', 'fruit', 'coffee', 'tea', 'rubber', 'other'];
const STATUSES = ['', 'ACTIVE', 'INACTIVE', 'FALLOW'];

export default function FilterBar({ filters, onFilterChange, fieldCount, totalCount }) {
  const handleSearch = useCallback(
    (text) => onFilterChange('search', text),
    [onFilterChange]
  );

  const cycleCrop = useCallback(() => {
    const idx = CROP_TYPES.indexOf(filters.cropType);
    const next = CROP_TYPES[(idx + 1) % CROP_TYPES.length];
    onFilterChange('cropType', next);
  }, [filters.cropType, onFilterChange]);

  const cycleStatus = useCallback(() => {
    const idx = STATUSES.indexOf(filters.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    onFilterChange('status', next);
  }, [filters.status, onFilterChange]);

  const hasFilters = filters.search || filters.cropType || filters.status;

  return (
    <View style={styles.container}>
      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search fields..."
        placeholderTextColor="#999"
        value={filters.search}
        onChangeText={handleSearch}
      />

      {/* Crop type filter */}
      <TouchableOpacity style={[styles.filterChip, filters.cropType && styles.chipActive]} onPress={cycleCrop}>
        <Text style={[styles.chipText, filters.cropType && styles.chipTextActive]}>
          {filters.cropType ? `🌱 ${filters.cropType}` : '🌱 Crop'}
        </Text>
      </TouchableOpacity>

      {/* Status filter */}
      <TouchableOpacity style={[styles.filterChip, filters.status && styles.chipActive]} onPress={cycleStatus}>
        <Text style={[styles.chipText, filters.status && styles.chipTextActive]}>
          {filters.status ? `● ${filters.status}` : '● Status'}
        </Text>
      </TouchableOpacity>

      {/* Field count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {fieldCount}{fieldCount !== totalCount ? `/${totalCount}` : ''}
        </Text>
      </View>

      {/* Clear filters */}
      {hasFilters && (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => {
            onFilterChange('search', '');
            onFilterChange('cropType', '');
            onFilterChange('status', '');
          }}
        >
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: -200 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
    gap: 6,
    maxWidth: 420,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 120,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  chipText: { fontSize: 11, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#1565C0' },
  countBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 11, color: '#666', fontWeight: '600' },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { fontSize: 12, color: '#E53935', fontWeight: '700' },
});