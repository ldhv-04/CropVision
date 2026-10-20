# Data Model Specification: Frontend World-Class Architecture Benchmark

**Feature**: `005-frontend-architecture-benchmark`  
**Phase**: Phase 1 (Data Model & Schema Design)  
**Date**: 2026-09-12  

---

## 1. Domain Entities & Schemas

### Entity 1: FieldFeature (Geospatial Boundary)
Represents a farm parcel or management zone with strictly validated RFC 7946 GeoJSON coordinates.

```typescript
export interface FieldCoordinates {
  // RFC 7946: [longitude, latitude] array representing closed linear ring
  ring: [number, number][];
}

export interface FieldProperties {
  id: string;
  name: string;
  cropType: string;
  areaHectares: number;
  healthIndex: number; // 0.0 to 1.0 (NDVI normalized)
  status: 'optimal' | 'warning' | 'critical' | 'dormant';
  lastScoutedAt: string; // ISO 8601
}

export interface FieldFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: FieldProperties;
}
```

**Validation Invariants**:
- Ring must have $\ge 4$ coordinate pairs, and the first and last coordinates must be identical.
- Longitude must be bounded in $[-180.0, 180.0]$; Latitude in $[-90.0, 90.0]$.
- Polygon area must be $> 0.0$ hectares (non-degenerate).

---

### Entity 2: InferenceScan (Edge & Cloud Disease Diagnosis)
Represents an on-device or cloud-analyzed plant disease scan.

```typescript
export interface DetectionBox {
  boxId: string;
  label: string;
  confidence: number; // 0.0 to 1.0
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface InferenceScan {
  scanId: string;
  fieldId: string;
  capturedAt: string; // ISO 8601
  imageUri: string;
  diseaseName: string;
  severityLevel: 'healthy' | 'mild' | 'moderate' | 'severe';
  severityScore: number; // 0 to 100
  detections: DetectionBox[];
  recommendation: string;
  isSynced: boolean;
}
```

---

### Entity 3: OfflineMutation (Idempotent Sync Queue)
Represents an offline field mutation waiting for network reconnection and reconciliation.

```typescript
export type MutationType = 'CREATE_FIELD' | 'UPDATE_FIELD_GEOMETRY' | 'RECORD_DIAGNOSIS' | 'UPDATE_ZONE_METRICS';

export interface OfflineMutation {
  mutationId: string; // UUID v4
  idempotencyKey: string; // SHA-256 hash of payload + timestamp
  type: MutationType;
  payload: Record<string, unknown>;
  createdAt: string; // ISO 8601
  retryCount: number;
  lastAttemptAt: string | null;
  status: 'pending' | 'syncing' | 'failed' | 'acknowledged';
  errorMessage?: string;
}
```

---

### Entity 4: GISViewportState
Represents the current spatial rendering viewport and active layer configuration.

```typescript
export interface GISViewportState {
  center: [number, number]; // [longitude, latitude]
  zoom: number; // 0 to 22
  pitch: number; // 0 to 60 (3D tilt)
  bearing: number; // 0 to 360 (rotation)
  selectedFeatureId: string | null;
  hoverFeatureId: string | null;
  activeLayers: {
    satelliteBase: boolean;
    ndviHeatmap: boolean;
    diseaseOutbreaks: boolean;
    weatherRadar: boolean;
  };
}
```
