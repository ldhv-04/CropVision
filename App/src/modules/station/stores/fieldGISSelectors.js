/**
 * fieldGISSelectors.js — Pure selectors for Station GIS Store
 */

export const selectSelectedField = (state) =>
  state.fields.find((field) => field.id === state.selectedFieldId);

export const selectFieldCounts = (state) => {
  const total = state.fields.length;
  const active = state.fields.filter((field) => field.status === 'ACTIVE' || !field.status).length;
  return { total, active, inactive: total - active };
};

export const selectListFields = (state) => {
  let result = state.fields;

  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    result = result.filter((field) => {
      const name = (field.name || '').toLowerCase();
      const crop = (field.crop_type || '').toLowerCase();
      const code = (field.field_code || '').toLowerCase();
      return name.includes(query) || crop.includes(query) || code.includes(query);
    });
  }
  if (state.filters.status) {
    result = result.filter((field) => field.status === state.filters.status);
  }
  if (state.filters.cropType) {
    result = result.filter((field) => field.crop_type === state.filters.cropType);
  }

  return result;
};

export const selectMapFields = (state) => {
  let result = state.fields;

  if (state.filters.search) {
    const query = state.filters.search.toLowerCase();
    result = result.filter(
      (field) =>
        field.name.toLowerCase().includes(query) ||
        field.crop_type?.toLowerCase().includes(query),
    );
  }
  if (state.filters.cropType) {
    result = result.filter((field) => field.crop_type === state.filters.cropType);
  }
  if (state.filters.status) {
    result = result.filter((field) => field.status === state.filters.status);
  }

  return result;
};
