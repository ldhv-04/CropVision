/**
 * Feature Flags — Station Module
 *
 * Controls progressive feature rollout.
 * All flags default to TRUE in development, FALSE in production.
 */

export const FEATURE_FLAGS = {
  // New GIS-based FieldsPage (vs legacy CSS circles)
  GIS_FIELDS_PAGE: process.env.EXPO_PUBLIC_GIS_FIELDS === 'true' || __DEV__,

  // Polygon editing capabilities
  POLYGON_EDITING: true,

  // Soft delete with trash recovery
  SOFT_DELETE: true,

  // Center+radius polygon generator
  CENTER_RADIUS_GENERATOR: true,
};