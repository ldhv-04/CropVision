/**
 * Geospatial Field & Zone Domain Transfer Objects
 * RFC 7946 compliant GeoJSON coordinate definitions.
 * Strictly adheres to Rule 2.1 (<= 300 LOC) and Rule 2.2 (Strict Typing).
 */

export interface FieldProperties {
  id: string;
  name: string;
  cropType: string;
  areaHectares: number;
  healthIndex: number;
  status: 'optimal' | 'warning' | 'critical' | 'dormant';
  lastScoutedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface FieldGeometry {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface FieldFeature {
  type: 'Feature';
  id: string;
  geometry: FieldGeometry;
  properties: FieldProperties;
}

export interface GISViewportState {
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  pitch: number;
  bearing: number;
  selectedFeatureId: string | null;
  hoverFeatureId: string | null;
  activeLayers: {
    satelliteBase: boolean;
    ndviHeatmap: boolean;
    diseaseOutbreaks: boolean;
    weatherRadar: boolean;
  };
}
