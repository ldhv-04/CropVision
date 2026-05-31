# GIS Field Management Redesign — Architecture, UX & Migration Specification

> **Version:** 1.0.0  
> **Date:** 2026-05-31  
> **Status:** PLANNING — Do NOT implement yet  
> **Methodology:** CodeGraph-first discovery → Audit → Design → Migration Strategy  

---

## Table of Contents

1. [Phase 1 — CodeGraph Discovery Report](#phase-1--codegraph-discovery-report)
2. [Phase 2 — Current GIS Audit](#phase-2--current-gis-audit)
3. [Phase 3 — Map Platform Design](#phase-3--map-platform-design)
4. [Phase 4 — Field Data Model Redesign](#phase-4--field-data-model-redesign)
5. [Phase 5 — Field Creation UX Specification](#phase-5--field-creation-ux-specification)
6. [Phase 6 — Field Editing UX Specification](#phase-6--field-editing-ux-specification)
7. [Phase 7 — Field Deletion UX Specification](#phase-7--field-deletion-ux-specification)
8. [Phase 8 — Map View Redesign Specification](#phase-8--map-view-redesign-specification)
9. [Phase 9 — Backup & Rollback Strategy](#phase-9--backup--rollback-strategy)
10. [Phase 10 — Implementation Roadmap](#phase-10--implementation-roadmap)

---

## Phase 1 — CodeGraph Discovery Report

### 1.1 Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATION MODULE (TARGET)                       │
│  FieldsPage.jsx ──→ CSS circles, mock data, no real map         │
│  SoilzeProShell.jsx ──→ Layout container                        │
│  Sidebar.jsx ──→ Navigation                                     │
│  endpoints.js ──→ /api/fields/*                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ SHARES API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AGRIVISION MODULE (REFERENCE)                    │
│  FieldMapScreen.jsx ──→ Main map screen                         │
│  FieldMapCanvas.jsx ──→ Platform-split Leaflet/native map       │
│  ZonePolygon.jsx ──→ GeoJSON polygon renderer                   │
│  mapHelpers.js ──→ extractPolygonCoords, toGeoJsonPolygon       │
│  useFieldStore.js ──→ Zustand field state                       │
│  fieldMapStore.js ──→ Map viewport state                        │
│  useFieldMap.js ──→ Map interaction hook                        │
│  useFieldSelector.js ──→ Zone selection logic                   │
│  useLayerColor.js ──→ Dynamic color coding                      │
│  useZoneMetrics.js ──→ Metric aggregation                       │
│  colorScales.js ──→ Color scale utilities                       │
│  metricCalculators.js ──→ Health score calculation              │
└────────────────────────────┬────────────────────────────────────┘
                             │ API CALLS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND                                    │
│  fieldController.js ──→ CRUD + boundary support                 │
│  fieldRoutes.js ──→ /api/fields/*                               │
│  subZoneController.js ──→ Zone CRUD                             │
│  subZoneRoutes.js ──→ /api/fields/:id/subzones/*                │
│  geoService.js ──→ Turf.js boundary validation                  │
│  metricAggregationService.js ──→ Zone metrics                   │
│  db.js ──→ PostgreSQL pool                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ SCHEMA
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE                                      │
│  fields ──→ id, user_id, name, crop_type, area,                │
│             latitude, longitude, boundary(JSONB),               │
│             growth_stage, planting_date                          │
│  sub_zones ──→ id, field_id, crop_type, boundary(JSONB),       │
│                status, health_score, planting_date               │
│  zone_metrics ──→ health_score, temperature, humidity, etc.     │
│  disease_reports ──→ sub_zone_id, disease_type                  │
│  zone_alerts ──→ sub_zone_id, threat_level                      │
│  gps_walks ──→ field_id, points(JSONB), is_completed            │
│  field_activities ──→ field_id, activity_type, notes            │
│  zone_health_history ──→ sub_zone_id, status, health_score      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Impact Analysis

| Component | Impact Level | Reason |
|-----------|-------------|--------|
| `FieldsPage.jsx` | **CRITICAL** | Complete replacement — CSS circles → real map + polygons |
| `fieldController.js` | **MODERATE** | Add soft delete, centroid auto-calc, polygon validation |
| `fieldRoutes.js` | **LOW** | Add soft delete endpoint, possibly bulk operations |
| `fields` table schema | **MODERATE** | Add `deleted_at`, `is_active`, `center_lat/lng` computed |
| `endpoints.js` | **LOW** | Add new field endpoints if needed |
| `mapHelpers.js` | **LOW** | Add center+radius→polygon conversion |
| `geoService.js` | **LOW** | Add polygon area calculation, centroid derivation |
| `FieldMapCanvas.jsx` | **NONE** | Already supports polygons — reuse as-is |
| `ZonePolygon.jsx` | **NONE** | Already supports polygons — reuse as-is |
| `useFieldStore.js` | **MODERATE** | Extend with polygon editing state |

### 1.3 GIS Migration Scope

**Files to CREATE:**
- `App/src/modules/station/components/gis/` — New GIS component directory
- `App/src/modules/station/components/gis/StationMapCanvas.jsx` — Station-specific map wrapper
- `App/src/modules/station/components/gis/FieldPolygon.jsx` — Field-level polygon renderer
- `App/src/modules/station/components/gis/PolygonEditor.jsx` — Draw/edit polygon tool
- `App/src/modules/station/components/gis/CoordinateEntry.jsx` — Manual coordinate input
- `App/src/modules/station/components/gis/RadiusGenerator.jsx` — Center+radius→polygon
- `App/src/modules/station/components/gis/FieldDetailPanel.jsx` — Side panel drawer
- `App/src/modules/station/components/gis/LayerControls.jsx` — Map layer switcher
- `App/src/modules/station/components/gis/MapToolbar.jsx` — Draw/measure/pan tools
- `App/src/modules/station/stores/fieldGISStore.js` — Zustand store for GIS state
- `App/src/modules/station/hooks/useFieldGIS.js` — GIS interaction hook
- `App/src/modules/station/hooks/usePolygonDraw.js` — Polygon drawing hook
- `App/src/modules/station/utils/fieldGeometry.js` — Field geometry utilities

**Files to MODIFY:**
- `App/src/modules/station/pages/FieldsPage.jsx` — Complete rewrite
- `backend/src/controllers/fieldController.js` — Soft delete, validation
- `backend/src/services/geoService.js` — Area calc, centroid, circle→polygon
- `backend/run-migration.js` — Add `deleted_at` column
- `App/src/modules/@core/api/endpoints.js` — New endpoints

**Files to BACKUP (preserve original):**
- `App/src/modules/station/pages/FieldsPage.jsx` → `FieldsPage.legacy.jsx`

---

## Phase 2 — Current GIS Audit

### 2.1 Current Field Rendering Implementation

#### System A: Station Module (THE PROBLEM)

**File:** `App/src/modules/station/pages/FieldsPage.jsx`

**How circles are generated:**
- Fields are rendered as CSS `<div>` elements with `borderRadius: '50%'`
- Positioned using hardcoded percentage-based `left`/`top` values on a CSS grid background
- The grid background uses `linear-gradient` to simulate a map grid
- No actual geographic coordinates are used for positioning
- Mock data with 5 hardcoded fields (Field A through E)

```jsx
// Current circle rendering (FieldsPage.jsx ~line 249-261)
<div style={{
  position: 'absolute',
  left: `${field.position.x}%`,   // e.g., 25%
  top: `${field.position.y}%`,    // e.g., 30%
  width: isFieldSelected ? 48 : 36,
  height: isFieldSelected ? 48 : 36,
  borderRadius: '50%',
  backgroundColor: `${HEALTH_COLORS[field.health]}30`,
  border: `2px solid ${HEALTH_COLORS[field.health]}`,
}}>🌾</div>
```

**How coordinates are stored:**
- Mock data uses `position: { x: 25, y: 30 }` — percentage-based, NOT GPS coordinates
- No API integration — data is entirely hardcoded
- No connection to the backend `fields` table

**Current CRUD operations:**
- Create: Opens a modal form, but only stores locally in React state
- Read: Hardcoded mock array
- Update: Local state only
- Delete: Local state only
- **None persist to backend**

**Current map technology:**
- NONE — pure CSS grid with gradient background
- Comment in code: `{/* Field polygon (simplified as circle) */}`

#### System B: AgriVision Module (THE REFERENCE)

**File:** `App/src/modules/agrivision/components/map/FieldMapCanvas.jsx`

**How polygons are rendered:**
- Uses `react-leaflet` (web) and `react-native-maps` (mobile)
- GeoJSON Polygon/MultiPolygon boundaries stored in `zone.boundary`
- `ZonePolygon.jsx` renders each zone as a Leaflet `<Polygon>` or native `<Polygon>`
- Dynamic color coding via `useLayerColor` hook
- Selection state with white stroke highlight

**How coordinates are stored:**
- GeoJSON standard: `{ type: "Polygon", coordinates: [[[lng, lat], ...]] }`
- Stored in PostgreSQL `boundary JSONB` column
- Coordinate convention: GeoJSON [lng, lat] → Leaflet [lat, lng] conversion in `mapHelpers.js`

**Map technology:**
- Web: `react-leaflet` v5.0.0 with OpenStreetMap tiles
- Mobile: `react-native-maps` v1.27.2 with default provider
- Platform detection via `Platform.OS === 'web'`

### 2.2 Current GIS Architecture Report

```
STATION MODULE (Current State)
├── FieldsPage.jsx
│   ├── Mock data (5 hardcoded fields)
│   ├── CSS grid "map" (gradient background)
│   ├── Circle divs (borderRadius: 50%)
│   ├── Health color coding (green/yellow/orange/red)
│   ├── Side panel (field list + detail drawer)
│   ├── Create modal (basic form, no map)
│   ├── KPI cards (total fields, area, health, crops)
│   └── NO real map, NO GPS, NO API integration
│
AGRIVISION MODULE (Reference Implementation)
├── FieldMapCanvas.jsx
│   ├── Leaflet MapContainer (web)
│   ├── react-native-maps MapView (mobile)
│   ├── OpenStreetMap tiles
│   ├── ZonePolygon.jsx (GeoJSON rendering)
│   ├── Bounds fitting
│   └── Map event handling
├── mapHelpers.js
│   ├── extractPolygonCoords (GeoJSON → Leaflet)
│   ├── toGeoJsonPolygon (Leaflet → GeoJSON)
│   ├── calculateBounds / calculateFieldBounds
│   ├── calculateCentroid
│   └── simplifyPoints (Douglas-Peucker)
├── useFieldStore.js (Zustand)
├── fieldMapStore.js
└── Platform-split architecture

BACKEND
├── fieldController.js
│   ├── getFields (with zone_status filter)
│   ├── createField (accepts boundary JSONB)
│   ├── getFieldById (with activities)
│   ├── updateField (accepts boundary JSONB)
│   ├── deleteField (HARD DELETE — no soft delete)
│   └── getZonesSummary
├── geoService.js
│   ├── validateSubZone (Turf.js booleanWithin)
│   └── validateGeoJsonPolygon (structural check)
└── Database
    ├── fields (boundary JSONB, lat/lng NUMERIC)
    ├── sub_zones (boundary JSONB NOT NULL)
    ├── gps_walks (points JSONB)
    └── field_activities
```

### 2.3 Key Gaps Identified

| Gap | Severity | Description |
|-----|----------|-------------|
| No real map in Station | CRITICAL | CSS circles vs actual Leaflet map |
| No polygon drawing | HIGH | Users cannot draw field boundaries |
| No polygon editing | HIGH | Cannot move/add/remove vertices |
| No center+radius→polygon | MEDIUM | Convenience feature missing |
| No soft delete | MEDIUM | Hard DELETE, no recovery |
| No API integration in Station | CRITICAL | Mock data only |
| No GPS walk integration | LOW | `gps_walks` table exists but unused in Station |
| No area auto-calculation | MEDIUM | `area` is manual input, not derived from polygon |

---

## Phase 3 — Map Platform Design

### 3.1 Option Evaluation

#### Option A: React Leaflet (RECOMMENDED ✅)

| Criterion | Assessment |
|-----------|-----------|
| OpenStreetMap support | ✅ Native — `TileLayer` with OSM tiles |
| Polygon rendering | ✅ Built-in `<Polygon>` component |
| Polygon editing | ✅ Via `@geoman-io/leaflet-geoman-free` or custom handlers |
| GIS capabilities | ✅ Full Leaflet ecosystem (markers, popups, GeoJSON layers, CRS) |
| Performance | ✅ Canvas/SVG rendering, handles 1000+ polygons |
| Scalability | ✅ Marker clustering, canvas renderer for large datasets |
| Already in project | ✅ `react-leaflet` v5.0.0 already in `package.json` |
| Mobile support | ⚠️ Web-only; mobile uses `react-native-maps` (existing pattern) |

#### Option B: Mapbox GL JS

| Criterion | Assessment |
|-----------|-----------|
| OpenStreetMap support | ✅ Mapbox tiles (requires API key) |
| Polygon rendering | ✅ GeoJSON source + fill layer |
| Polygon editing | ⚠️ Requires `@mapbox/mapbox-gl-draw` |
| GIS capabilities | ✅ Advanced (3D, vector tiles, WebGL) |
| Performance | ✅ Superior (WebGL rendering) |
| Scalability | ✅ Excellent (vector tiles) |
| Already in project | ❌ Not installed — requires new dependency + API key |
| Mobile support | ⚠️ Requires `@rnmapbox/maps` for React Native |

### 3.2 Recommendation

**Selected: Option A — React Leaflet**

**Rationale:**
1. **Zero migration cost** — `react-leaflet` v5.0.0 already in `package.json`
2. **Proven pattern** — `FieldMapCanvas.jsx` and `ZonePolygon.jsx` already demonstrate the architecture
3. **Platform-split works** — Leaflet on web, `react-native-maps` on mobile (existing pattern)
4. **Polygon editing** — `@geoman-io/leaflet-geoman-free` provides draw/edit/delete tools
5. **OSM tiles** — Free, no API key, sufficient for agricultural GIS
6. **Community** — Largest Leaflet React wrapper, well-documented

**Required new dependencies:**
- `@geoman-io/leaflet-geoman-free` — Polygon draw/edit/delete toolbar
- `@turf/area` — Polygon area calculation (backend)
- `@turf/circle` — Circle to polygon conversion (backend)
- `@turf/centroid` — Centroid calculation (backend)

### 3.3 Map Architecture (Reusing Existing Pattern)

```
StationMapCanvas (NEW — wraps existing FieldMapCanvas pattern)
├── Platform Split
│   ├── Web: LeafletMapContainer
│   │   ├── TileLayer (OpenStreetMap)
│   │   ├── GeoJSON FeatureLayer (field boundaries)
│   │   ├── DrawControl (geoman — polygon draw/edit)
│   │   ├── MarkerLayer (field centers, sensors)
│   │   └── MapEvents (click, moveend, zoomend)
│   └── Native: NativeMapContainer
│       ├── MapView (react-native-maps)
│       ├── Polygon overlays
│       └── Custom draw mode (tap-to-add-vertex)
├── FloatingOverlayUI
│   ├── MapToolbar (Draw, Edit, Measure, Pan)
│   ├── LayerSwitcher (Satellite, Terrain, OSM)
│   ├── FilterBar (crop type, status)
│   └── ZoomControls
├── SidePanel (Right)
│   ├── FieldList (scrollable)
│   ├── FieldDetailDrawer
│   └── CreateFieldDrawer
└── BottomSheet (Mobile)
    ├── Field Quick View
    └── Action Buttons
```

---

## Phase 4 — Field Data Model Redesign

### 4.1 Current Model

```sql
-- EXISTING fields table
CREATE TABLE fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    crop_type       VARCHAR(255) NOT NULL,
    area            NUMERIC(10, 2),           -- Manual input
    latitude        NUMERIC(10, 6) NOT NULL,  -- Center point
    longitude       NUMERIC(10, 6) NOT NULL,  -- Center point
    boundary        JSONB,                     -- GeoJSON (optional, added later)
    growth_stage    VARCHAR(50) DEFAULT 'germination',
    planting_date   DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Problems:**
- `latitude`/`longitude` are required but redundant when `boundary` exists
- `area` is manual input, not derived from polygon
- No soft delete capability
- No `updated_at` timestamp
- No field status tracking

### 4.2 New Model

```sql
-- UPDATED fields table
CREATE TABLE fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    crop_type       VARCHAR(255) NOT NULL,
    area            NUMERIC(12, 4),            -- Auto-calculated from boundary (hectares)
    latitude        NUMERIC(10, 6),            -- Auto-derived centroid (nullable)
    longitude       NUMERIC(10, 6),            -- Auto-derived centroid (nullable)
    boundary        JSONB,                      -- GeoJSON Polygon (PRIMARY geometry)
    growth_stage    VARCHAR(50) DEFAULT 'germination',
    planting_date   DATE,
    color           VARCHAR(7) DEFAULT '#4CAF50', -- Display color hex
    status          VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'FALLOW')),
    notes           TEXT,
    
    -- Soft delete
    deleted_at      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for soft delete filtering
CREATE INDEX idx_fields_active ON fields(user_id, is_active) WHERE is_active = TRUE;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_fields_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fields_updated_at
    BEFORE UPDATE ON fields
    FOR EACH ROW
    EXECUTE FUNCTION update_fields_timestamp();
```

### 4.3 GeoJSON Boundary Specification

```jsonc
// Field boundary — GeoJSON Polygon
{
  "type": "Polygon",
  "coordinates": [
    [
      [106.6297, 10.8231],  // [longitude, latitude] — vertex 1
      [106.6315, 10.8231],  // vertex 2
      [106.6315, 10.8245],  // vertex 3
      [106.6297, 10.8245],  // vertex 4
      [106.6297, 10.8231]   // closing ring = vertex 1
    ]
  ]
}

// Constraints:
// - Minimum 3 vertices (4 points including closing ring)
// - Maximum 1000 vertices (performance)
// - Must be valid GeoJSON (RFC 7946)
// - Coordinates in WGS84 (EPSG:4326)
// - Longitude: -180 to 180
// - Latitude: -90 to 90
// - Ring must be closed (first = last point)
// - Ring winding: counter-clockwise (exterior ring per RFC 7946)
```

### 4.4 Validation Rules

| Rule | Implementation | Layer |
|------|---------------|-------|
| Minimum 3 vertices | Frontend + Backend | `validateGeoJsonPolygon` |
| Valid GeoJSON structure | Backend | `geoService.validateGeoJsonPolygon` |
| Coordinates in range | Frontend + Backend | `lat ∈ [-90,90], lng ∈ [-180,180]` |
| Ring closure | Frontend auto-close | `mapHelpers.toGeoJsonPolygon` |
| Max vertices (1000) | Frontend warning + Backend reject | Performance guard |
| Non-self-intersecting | Backend (Turf.js) | `@turf/boolean-valid` |
| Area > 0 | Backend | `@turf/area` |
| No duplicate vertices | Frontend dedup | Drawing tool |

### 4.5 Migration Strategy

```sql
-- Migration script (run after backup)
-- Step 1: Add new columns
ALTER TABLE fields ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE fields ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#4CAF50';
ALTER TABLE fields ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Make lat/lng nullable (was NOT NULL)
ALTER TABLE fields ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE fields ALTER COLUMN longitude DROP NOT NULL;

-- Step 3: Migrate existing circle-based fields to polygon
-- For fields with lat/lng but no boundary: generate 50m radius polygon
-- This will be handled by a migration script in Node.js

-- Step 4: Auto-derive area from boundary where possible
-- UPDATE fields SET area = ST_Area(ST_GeomFromGeoJSON(boundary)) * 111319.9 * 111319.9 ...
```

**Migration Script (Node.js — `backend/scripts/migrate-fields-to-polygon.js`):**

```javascript
// For each field with lat/lng but no boundary:
// 1. Generate a 50m radius circle as polygon (24 vertices)
// 2. Store as boundary JSONB
// 3. Auto-calculate area
// Uses @turf/circle: circle([lng, lat], radiusKm, options)
```

### 4.6 API Changes

#### Updated Endpoints

```
GET    /api/fields                    — List fields (exclude soft-deleted)
POST   /api/fields                    — Create field (boundary required)
GET    /api/fields/:id                — Get field detail
PUT    /api/fields/:id                — Update field (boundary editable)
DELETE /api/fields/:id                — Soft delete (sets deleted_at)
PATCH  /api/fields/:id/restore        — Restore soft-deleted field
GET    /api/fields/:id/zones/summary  — Zone metrics summary
```

#### Request/Response Schemas

**POST /api/fields (Create)**
```jsonc
{
  "name": "North Paddy Field",
  "crop_type": "rice",
  "boundary": {                    // REQUIRED — GeoJSON Polygon
    "type": "Polygon",
    "coordinates": [[[106.6297, 10.8231], [106.6315, 10.8231], [106.6315, 10.8245], [106.6297, 10.8245], [106.6297, 10.8231]]]
  },
  "growth_stage": "seedling",      // Optional
  "planting_date": "2026-05-15",   // Optional
  "color": "#4CAF50",              // Optional
  "notes": "Irrigated section"     // Optional
  // latitude, longitude — AUTO-DERIVED from boundary centroid
  // area — AUTO-CALCULATED from boundary
}
```

**POST /api/fields/generate-polygon (Center+Radius→Polygon)**
```jsonc
{
  "latitude": 10.8231,
  "longitude": 106.6297,
  "radius_meters": 200,           // Radius in meters
  "vertices": 32                  // Optional, default 32
}
// Response: { success: true, data: { boundary: { type: "Polygon", coordinates: [...] }, area_hectares: 1.26 } }
```

**PUT /api/fields/:id (Update)**
```jsonc
{
  "name": "Updated Name",          // Optional
  "crop_type": "corn",             // Optional
  "boundary": { ... },             // Optional — new polygon
  "growth_stage": "flowering",     // Optional
  "planting_date": "2026-04-01",   // Optional
  "color": "#FF9800",              // Optional
  "status": "ACTIVE",              // Optional
  "notes": "Updated notes"         // Optional
}
```

---

## Phase 5 — Field Creation UX Specification

### 5.1 Method A: Polygon Drawing

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Create Field" button (top toolbar)          │
│ 2. Map enters DRAW MODE                                     │
│    - Cursor changes to crosshair                            │
│    - Toolbar shows: [Undo] [Cancel] [Finish]                │
│    - Map overlay text: "Click to add vertices"              │
│ 3. User clicks on map to add vertices                       │
│    - Each click adds a vertex marker                        │
│    - Lines connect vertices sequentially                    │
│    - Live area calculation shown in floating tooltip        │
│    - Polygon preview with semi-transparent fill             │
│ 4. User clicks "Finish" or clicks first vertex to close     │
│    - Polygon closes and fills                               │
│    - Auto-area calculation displayed                        │
│    - Centroid marker placed                                 │
│ 5. Create Field drawer slides in from right                 │
│    - Pre-filled: area (calculated), centroid coords         │
│    - User enters: name, crop_type, planting_date, notes     │
│ 6. User clicks "Save"                                       │
│    - Frontend validates: ≥3 vertices, valid GeoJSON         │
│    - POST /api/fields with boundary GeoJSON                 │
│    - Success → polygon persists on map                      │
│    - Error → inline validation messages                     │
└─────────────────────────────────────────────────────────────┘
```

#### Validation Rules (Polygon Drawing)

| Rule | Behavior |
|------|----------|
| < 3 points | "Finish" button disabled |
| Self-intersecting | Warning toast: "Polygon crosses itself" |
| Area < 0.01 ha | Warning: "Field very small (< 100m²)" |
| Area > 10,000 ha | Warning: "Field very large (> 10,000 ha)" |
| Max 1000 vertices | Auto-stop with warning |
| Undo | Removes last vertex |
| Cancel | Clears all vertices, exits draw mode |
| Escape key | Exits draw mode |

#### Error Handling

| Error | UX Response |
|-------|-------------|
| Network failure on save | Toast: "Failed to save. Check connection." + keep form data |
| Validation error | Inline messages under each invalid field |
| Duplicate field name | Warning: "Field name exists. Continue?" → confirm dialog |
| Map tile load failure | Show fallback gray tiles + error banner |

### 5.2 Method B: Manual Coordinate Entry

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User opens "Create Field" → selects "Coordinates" tab    │
│ 2. Coordinate entry form appears:                           │
│    ┌─────────────────────────────────────┐                  │
│    │ Vertices                            │                  │
│    │ ┌───┬────────────┬────────────┐     │                  │
│    │ │ # │ Latitude   │ Longitude  │     │                  │
│    │ ├───┼────────────┼────────────┤     │                  │
│    │ │ 1 │ 10.823100  │ 106.629700 │     │                  │
│    │ │ 2 │ 10.823100  │ 106.631500 │     │                  │
│    │ │ 3 │ 10.824500  │ 106.631500 │     │                  │
│    │ │ 4 │ 10.824500  │ 106.629700 │     │                  │
│    │ └───┴────────────┴────────────┘     │                  │
│    │ [+ Add Vertex]  [Remove Last]       │                  │
│    │                                     │                  │
│    │ [Preview on Map]  [Clear All]        │                  │
│    └─────────────────────────────────────┘                  │
│ 3. User adds coordinates row by row                        │
│ 4. Clicks "Preview on Map"                                  │
│    - Map zooms to polygon location                          │
│    - Polygon rendered with vertex markers                   │
│    - Area and centroid auto-calculated                      │
│ 5. User confirms and fills in field details                 │
│ 6. Save → POST /api/fields                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Validation Rules (Manual Entry)

| Rule | Behavior |
|------|----------|
| Latitude out of [-90, 90] | Red border + "Invalid latitude" |
| Longitude out of [-180, 180] | Red border + "Invalid longitude" |
| Non-numeric input | Red border + "Must be a number" |
| < 3 vertices | "Preview" disabled + "Need ≥ 3 points" |
| Empty field | Red border + "Required" |

### 5.3 Method C: Center Point + Radius

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User opens "Create Field" → selects "Center+Radius" tab  │
│ 2. Input form:                                              │
│    ┌─────────────────────────────────────┐                  │
│    │ Center Point                        │                  │
│    │ Latitude:  [10.823100        ]      │                  │
│    │ Longitude: [106.629700       ]      │                  │
│    │                                     │                  │
│    │ Radius (meters): [200        ]      │                  │
│    │ Vertices:        [32  ▼]            │                  │
│    │                                     │                  │
│    │ [Pick on Map]  [Generate Polygon]   │                  │
│    └─────────────────────────────────────┘                  │
│ 3. User enters center + radius                              │
│    OR clicks "Pick on Map" → map click sets center          │
│ 4. Clicks "Generate Polygon"                                │
│    - Backend: POST /api/fields/generate-polygon             │
│    - Uses @turf/circle to generate regular polygon          │
│    - Returns GeoJSON Polygon with N vertices                │
│ 5. Map shows generated polygon                              │
│    - User can switch to polygon edit mode to adjust         │
│    - Area auto-displayed                                    │
│ 6. Fill in field details → Save                             │
│    - Stores as POLYGON (not circle)                         │
│    - circle+radius is just a generation convenience         │
└─────────────────────────────────────────────────────────────┘
```

#### Polygon Generation Algorithm

```javascript
// Backend: geoService.generateCirclePolygon
function generateCirclePolygon(centerLat, centerLng, radiusMeters, vertices = 32) {
  const center = [centerLng, centerLat]; // GeoJSON [lng, lat]
  const radiusKm = radiusMeters / 1000;
  const options = { steps: vertices, units: 'kilometers' };
  const circle = turfCircle(center, radiusKm, options);
  return circle.geometry; // GeoJSON Polygon
}
```

### 5.4 Create Field Drawer Layout

```
┌─────────────────────────────────────────────┐
│  CREATE FIELD                          [X]  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┬───────────┬──────────────┐     │
│  │ Draw    │ Coords    │ Center+R     │     │  ← Tab selector
│  └─────────┴───────────┴──────────────┘     │
│                                             │
│  [Active tab content as described above]    │
│                                             │
│  ─────────────────────────────────────────  │
│  Field Details                               │
│                                             │
│  Name:        [_________________________]   │
│  Crop Type:   [Rice           ▼]            │
│  Growth Stage:[Germination    ▼]            │
│  Planting:    [📅 2026-05-31       ]         │
│  Color:       [🟢 ▼]                        │
│  Notes:       [_________________________]   │
│                                             │
│  ─────────────────────────────────────────  │
│  Summary                                     │
│  Area: 1.26 ha  |  Vertices: 24             │
│  Center: 10.8231, 106.6297                  │
│                                             │
│  [Cancel]              [💾 Save Field]       │
└─────────────────────────────────────────────┘
```

---

## Phase 6 — Field Editing UX Specification

### 6.1 Edit Polygon (Move/Add/Remove Vertices)

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects a field on the map (click polygon)          │
│ 2. Field detail panel opens (right side)                    │
│ 3. User clicks "Edit Boundary" button                       │
│ 4. Map enters EDIT MODE:                                    │
│    - Polygon vertices shown as draggable markers            │
│    - Edge midpoints shown as "+" markers (add vertex)       │
│    - Vertex markers show "×" on hover (remove)              │
│    - Toolbar: [Undo] [Cancel] [Save Changes]                │
│ 5. User can:                                                │
│    a. DRAG vertex → polygon reshapes in real-time           │
│    b. CLICK "+" midpoint → new vertex inserted              │
│    c. CLICK "×" on vertex → vertex removed                  │
│    - Minimum 3 vertices enforced (can't remove below 3)     │
│ 6. Live feedback:                                           │
│    - Area recalculated on every change                      │
│    - Centroid repositioned                                  │
│    - Change summary: "Area: 1.26 ha → 1.45 ha (+15%)"      │
│ 7. User clicks "Save Changes"                               │
│    - PUT /api/fields/:id with new boundary                  │
│    - Success → polygon updates on map                       │
│    - Failure → rollback to original shape                   │
└─────────────────────────────────────────────────────────────┘
```

#### Vertex Interaction Rules

| Action | Behavior | Constraints |
|--------|----------|-------------|
| Drag vertex | Real-time polygon reshape | Cursor: grab/grabbing |
| Add vertex (click midpoint) | Insert between adjacent vertices | Reindexes vertices |
| Remove vertex (click ×) | Delete vertex | Min 3 vertices |
| Undo | Revert last action | Stack-based undo (max 50) |
| Cancel | Revert all changes to original | Confirmation if changes exist |
| Save | Persist to backend | Validation before save |

### 6.2 Update Coordinates (Manual GPS Editing)

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects field → detail panel → "Edit Coordinates"   │
│ 2. Coordinate editor opens (same table as Method B create)  │
│ 3. Table pre-populated with current vertices                │
│ 4. User edits lat/lng values directly                       │
│ 5. "Preview" button updates map in real-time                │
│ 6. Save → PUT /api/fields/:id                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Resize Generated Fields (Center+Radius Update)

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects a field created via center+radius method    │
│ 2. Detail panel shows: "Originally generated from center    │
│    point + radius"                                          │
│ 3. User clicks "Regenerate"                                 │
│ 4. Form shows:                                              │
│    - Current center (editable lat/lng or pick on map)       │
│    - Current radius (editable slider or input)              │
│ 5. "Regenerate Polygon" → replaces boundary                 │
│    - Confirmation: "This will replace the current boundary" │
│ 6. User can switch to "Edit Polygon" to fine-tune after     │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Edit Field Metadata

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects field → detail panel                        │
│ 2. Clicks "Edit Details"                                    │
│ 3. Form with editable fields:                               │
│    - Name, Crop Type, Growth Stage, Planting Date,          │
│      Color, Status, Notes                                   │
│ 4. Save → PUT /api/fields/:id (only metadata, not boundary) │
└─────────────────────────────────────────────────────────────┘
```

### 6.5 Edit Confirmation & Conflict Handling

| Scenario | UX Response |
|----------|-------------|
| Save success | Toast: "Field updated" + polygon animates to new shape |
| Network error | Toast: "Save failed" + keep in edit mode |
| Concurrent edit | Warning: "Field was modified by another session. Reload?" |
| Invalid geometry | Inline: "Polygon must have ≥ 3 non-collinear points" |
| Unsaved changes on close | Confirm dialog: "Discard changes?" |

---

## Phase 7 — Field Deletion UX Specification

### 7.1 Delete Fields

#### UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects field on map or from field list             │
│ 2. Detail panel opens with field info                       │
│ 3. User clicks "Delete Field" button (trash icon)           │
│ 4. Confirmation dialog appears:                             │
│    ┌─────────────────────────────────────────┐              │
│    │  ⚠️  Delete Field?                       │              │
│    │                                         │              │
│    │  "North Paddy Field" will be moved to   │              │
│    │  trash. You can restore it within       │              │
│    │  30 days.                               │              │
│    │                                         │              │
│    │  This field has:                        │              │
│    │  • 3 sub-zones                          │              │
│    │  • 12 disease reports                   │              │
│    │  • 45 activities                        │              │
│    │                                         │              │
│    │  [Cancel]    [🗑️ Move to Trash]         │              │
│    └─────────────────────────────────────────┘              │
│ 5. Soft delete:                                             │
│    - Sets deleted_at = NOW(), is_active = FALSE             │
│    - Field disappears from map and list                     │
│    - Toast: "Field moved to trash" with [Undo] action       │
│ 6. Undo available for 10 seconds after deletion             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Soft Delete Implementation

```sql
-- Backend: Soft delete query
UPDATE fields
SET deleted_at = NOW(), is_active = FALSE
WHERE id = $1 AND user_id = $2;

-- List query excludes soft-deleted
SELECT * FROM fields
WHERE user_id = $1 AND is_active = TRUE
ORDER BY created_at DESC;

-- Restore query
UPDATE fields
SET deleted_at = NULL, is_active = TRUE
WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL;
```

### 7.3 Recovery Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ TRASH / RECOVERY VIEW                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🗑️  Recently Deleted Fields                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ North Paddy Field    Deleted 2 hours ago            │    │
│  │ Rice • 1.26 ha • 3 zones                           │    │
│  │ [Restore]  [Delete Permanently]                     │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ South Corn Plot      Deleted 1 day ago              │    │
│  │ Corn • 0.85 ha • 1 zone                            │    │
│  │ [Restore]  [Delete Permanently]                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Fields in trash are automatically permanently deleted      │
│  after 30 days.                                             │
│                                                             │
│  [Empty Trash]                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Permanent Delete

- Only available from Trash view
- Requires second confirmation: "This action cannot be undone"
- CASCADE deletes: sub_zones, zone_metrics, disease_reports, zone_alerts, field_activities, gps_walks
- Hard DELETE from database

### 7.5 Delete API Endpoints

```
DELETE /api/fields/:id              → Soft delete (sets deleted_at)
PATCH  /api/fields/:id/restore      → Restore from trash
GET    /api/fields/trash             → List soft-deleted fields
DELETE /api/fields/:id/permanent     → Hard delete (from trash only)
DELETE /api/fields/trash             → Empty entire trash
```

---

## Phase 8 — Map View Redesign Specification

### 8.1 Design Reference

Based on `docs/soilzepro-research/map-view-analysis.md`, the new Station FieldsPage must implement:

- Full-bleed map viewport (100% working area)
- Floating UI overlays (non-intrusive)
- Progressive disclosure (zoom-dependent detail)
- Contextual side panels
- Layer controls
- Dynamic legends

### 8.2 New FieldsPage Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ TopHeader (existing)                                                  │
├─────────┬────────────────────────────────────────────────────────────┤
│         │                                                            │
│ Sidebar │  ┌──────────────────────────────────────────────────────┐  │
│ (exist) │  │ [Search...] │ [Crop ▼] [Status ▼] │ [+ New] [🗑️]   │  │
│         │  ├──────────────────────────────────────────────────────┤  │
│         │  │                                                      │  │
│         │  │  [🗺️]        ┌─────┐                     [Layers]   │  │
│         │  │  [+]        / Field\                               │  │
│         │  │  [-]       /  A     \          ┌──────┐            │  │
│         │  │           / (Rice)   \         |Field |            │  │
│         │  │  [Draw]   \  1.26ha  /         |  B   |            │  │
│         │  │  [Edit]    \-------/           \------/            │  │
│         │  │  [Measure]                                        │  │
│         │  │                                      ┌────────────┐│  │
│         │  │                                      │ FIELD A    ││  │
│         │  │                                      │ Rice       ││  │
│         │  │                                      │ 1.26 ha    ││  │
│         │  │                                      │ Healthy    ││  │
│         │  │                                      │            ││  │
│         │  │                                      │ [Edit]     ││  │
│         │  │                                      │ [Delete]   ││  │
│         │  │                                      │ [Zones]    ││  │
│         │  │                                      └────────────┘│  │
│         │  └──────────────────────────────────────────────────────┘  │
│         │                                                            │
├─────────┴────────────────────────────────────────────────────────────┤
│ Bottom KPI Bar: Fields: 5 │ Total Area: 8.4 ha │ Healthy: 4 │ Alerts│
└──────────────────────────────────────────────────────────────────────┘
```

### 8.3 Component Architecture

```
FieldsPage.jsx (REWRITE)
├── SoilzeProShell (existing layout)
│   ├── Sidebar (existing navigation)
│   └── TopHeader (existing)
│
├── MapViewport (80% width)
│   ├── StationMapCanvas (NEW)
│   │   ├── Web: LeafletMapContainer
│   │   │   ├── TileLayer (OSM / Satellite toggle)
│   │   │   ├── FieldBoundaryLayer (all field polygons)
│   │   │   ├── DrawControl (geoman integration)
│   │   │   └── MapEvents (click, zoom, move)
│   │   └── Native: NativeMapContainer
│   │       ├── MapView
│   │       ├── FieldPolygon overlays
│   │       └── Custom draw gesture handler
│   │
│   ├── MapToolbar (floating, left edge)
│   │   ├── Pan/Select tool
│   │   ├── Draw Polygon tool
│   │   ├── Edit Boundary tool
│   │   ├── Measure tool
│   │   └── Current Location button
│   │
│   ├── LayerControls (floating, top-right)
│   │   ├── Base Map: [OSM] [Satellite] [Terrain]
│   │   ├── Overlays: [✓ Field Boundaries] [✓ Zones] [□ Sensors] [□ Heatmap]
│   │   └── Opacity slider
│   │
│   ├── FilterBar (floating, top-center)
│   │   ├── Search field name
│   │   ├── Crop type filter
│   │   ├── Health status filter
│   │   └── Active alerts filter
│   │
│   └── DynamicLegend (floating, bottom-right)
│       └── Shows color coding for active overlay
│
├── FieldDetailPanel (right side, 300px, slides in)
│   ├── Field header (name, crop, status badge)
│   ├── KPI mini-cards (area, zones, health score)
│   ├── Growth stage timeline
│   ├── Recent activities list
│   ├── Quick actions: [Edit] [Delete] [View Zones]
│   └── Close button
│
├── CreateFieldDrawer (right side, 400px, slides in)
│   ├── Tab: [Draw] [Coordinates] [Center+Radius]
│   ├── Active tab content
│   ├── Field details form
│   └── Save/Cancel buttons
│
├── BottomKPIBar (fixed bottom)
│   ├── Total fields count
│   ├── Total area
│   ├── Health distribution (mini chart)
│   └── Active alerts count
│
└── fieldGISStore (Zustand)
    ├── fields: Field[] — all loaded fields
    ├── selectedFieldId: string | null
    ├── activeTool: 'pan' | 'draw' | 'edit' | 'measure'
    ├── drawState: { vertices, isDrawing, previewPolygon }
    ├── editState: { fieldId, originalBoundary, currentVertices }
    ├── filters: { search, cropType, status, hasAlerts }
    ├── layers: { fields, zones, sensors, heatmap, baseMap }
    ├── panelState: { isOpen, mode: 'detail' | 'create' | 'edit' }
    └── Actions: selectField, setTool, startDraw, addVertex, etc.
```

### 8.4 Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1200px) | Map 70% + Detail Panel 30% |
| Tablet (768-1199px) | Map 100% + Floating panel overlay |
| Mobile (<768px) | Map 100% + Bottom sheet drawer |

### 8.5 Map Interaction States

| State | Map Behavior | Toolbar |
|-------|-------------|---------|
| **DEFAULT** | Pan/zoom, click polygon to select | Pan active |
| **DRAW** | Click to add vertices, cursor: crosshair | Draw active, [Undo][Cancel][Finish] |
| **EDIT** | Drag vertices, click midpoints | Edit active, [Undo][Cancel][Save] |
| **MEASURE** | Click to measure distance/area | Measure active, [Clear] |
| **FIELD_SELECTED** | Polygon highlighted, panel open | Pan active, [Edit][Delete] in panel |

### 8.6 Color Coding Strategy

```javascript
// Field boundary colors
const FIELD_COLORS = {
  ACTIVE: '#4CAF50',    // Green
  INACTIVE: '#9E9E9E',  // Gray
  FALLOW: '#795548',    // Brown
  SELECTED: '#2196F3',  // Blue highlight
};

// Health-based fill opacity
const HEALTH_OPACITY = {
  healthy: 0.2,
  warning: 0.3,
  critical: 0.4,
};

// Zone status colors (from existing colorScales.js)
const ZONE_COLORS = {
  HEALTHY: '#4CAF50',
  WARNING: '#FF9800',
  INFECTED: '#F44336',
};
```

---

## Phase 9 — Backup & Rollback Strategy

### 9.1 Pre-Migration Backup

#### File Backup

```powershell
# Create backup directory
mkdir -p backups/field-gis-redesign/2026-05-31

# Backup Station FieldsPage (preserving original)
Copy-Item "App/src/modules/station/pages/FieldsPage.jsx" `
          "App/src/modules/station/pages/FieldsPage.legacy.jsx"

# Backup backend field controller
Copy-Item "backend/src/controllers/fieldController.js" `
          "backups/field-gis-redesign/2026-05-31/fieldController.js.bak"

# Backup migration script
Copy-Item "backend/run-migration.js" `
          "backups/field-gis-redesign/2026-05-31/run-migration.js.bak"

# Backup geo service
Copy-Item "backend/src/services/geoService.js" `
          "backups/field-gis-redesign/2026-05-31/geoService.js.bak"

# Backup API endpoints
Copy-Item "App/src/modules/@core/api/endpoints.js" `
          "backups/field-gis-redesign/2026-05-31/endpoints.js.bak"
```

#### Database Backup

```powershell
# Full database dump before migration
pg_dump -h localhost -U postgres -d cropvision -f backups/field-gis-redesign/2026-05-31/pre-migration.sql

# Schema-only backup
pg_dump -h localhost -U postgres -d cropvision --schema-only -f backups/field-gis-redesign/2026-05-31/schema-before.sql
```

### 9.2 Rollback Plan

#### Level 1: Code Rollback (Instant)

```powershell
# Restore original FieldsPage
Copy-Item "App/src/modules/station/pages/FieldsPage.legacy.jsx" `
          "App/src/modules/station/pages/FieldsPage.jsx"

# Git rollback to pre-migration commit
git checkout HEAD~1 -- App/src/modules/station/pages/FieldsPage.jsx
git checkout HEAD~1 -- backend/src/controllers/fieldController.js
git checkout HEAD~1 -- backend/src/services/geoService.js
```

#### Level 2: Database Rollback (Safe)

```sql
-- Remove new columns (reversible)
ALTER TABLE fields DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE fields DROP COLUMN IF EXISTS is_active;
ALTER TABLE fields DROP COLUMN IF EXISTS status;
ALTER TABLE fields DROP COLUMN IF EXISTS color;
ALTER TABLE fields DROP COLUMN IF EXISTS notes;
ALTER TABLE fields DROP COLUMN IF EXISTS updated_at;

-- Restore NOT NULL constraints
ALTER TABLE fields ALTER COLUMN latitude SET NOT NULL;
ALTER TABLE fields ALTER COLUMN longitude SET NOT NULL;

-- Remove index
DROP INDEX IF EXISTS idx_fields_active;

-- Remove trigger
DROP TRIGGER IF EXISTS fields_updated_at ON fields;
DROP FUNCTION IF EXISTS update_fields_timestamp();
```

#### Level 3: Full Database Restore

```powershell
# Restore from pre-migration dump
psql -h localhost -U postgres -d cropvision -f backups/field-gis-redesign/2026-05-31/pre-migration.sql
```

### 9.3 Migration Safety Rules

| Rule | Description |
|------|-------------|
| **Additive only** | New columns are nullable with defaults — never break existing queries |
| **No data loss** | Original lat/lng columns preserved alongside boundary |
| **Feature flags** | New FieldsPage behind a toggle: `useGISFieldsPage` flag |
| **Parallel run** | Both old and new FieldsPage accessible during transition |
| **Git branch** | All changes on `feature/gis-field-redesign` branch |
| **Tested before merge** | Full E2E test suite must pass |

### 9.4 Feature Flag Strategy

```javascript
// App/src/modules/station/config/featureFlags.js
export const FEATURE_FLAGS = {
  GIS_FIELDS_PAGE: process.env.EXPO_PUBLIC_GIS_FIELDS === 'true' || __DEV__,
  POLYGON_EDITING: true,
  SOFT_DELETE: true,
  CENTER_RADIUS_GENERATOR: true,
};

// In routing/navigation:
// If GIS_FIELDS_PAGE → render new FieldsPage
// Else → render FieldsPage.legacy.jsx
```

---

## Phase 10 — Implementation Roadmap

### Phase A: CodeGraph Discovery ✅ COMPLETE

**Duration:** Done  
**Deliverables:**
- [x] Dependency graph
- [x] Impact analysis
- [x] GIS migration scope
- [x] File inventory

---

### Phase B: Map Platform Migration

**Duration:** 2-3 days  
**Dependencies:** None  
**Risk:** LOW  

**Tasks:**
1. Install `@geoman-io/leaflet-geoman-free` for polygon draw/edit
2. Create `App/src/modules/station/components/gis/` directory
3. Create `StationMapCanvas.jsx` — wrapper around existing Leaflet pattern
4. Create `FieldPolygon.jsx` — field-level polygon renderer (reuse ZonePolygon pattern)
5. Verify OSM tile loading on web and mobile
6. Create `fieldGISStore.js` (Zustand store)
7. Test polygon rendering with sample GeoJSON data

**Acceptance Criteria:**
- Real OpenStreetMap renders in Station module
- Sample field polygons display correctly
- Platform split works (web: Leaflet, mobile: react-native-maps)

---

### Phase C: GIS Data Model Migration

**Duration:** 1-2 days  
**Dependencies:** Phase B  
**Risk:** MEDIUM  

**Tasks:**
1. Write migration script to add new columns to `fields` table
2. Write `backend/scripts/migrate-fields-to-polygon.js` — convert existing lat/lng/radius to polygon boundary
3. Update `fieldController.js`:
   - Auto-derive lat/lng from boundary centroid
   - Auto-calculate area from boundary using `@turf/area`
   - Add soft delete (`deleted_at`, `is_active`)
   - Add `GET /api/fields/trash` endpoint
   - Add `PATCH /api/fields/:id/restore` endpoint
4. Update `geoService.js`:
   - Add `generateCirclePolygon(center, radius, vertices)` using `@turf/circle`
   - Add `calculatePolygonArea(boundary)` using `@turf/area`
   - Add `calculateCentroid(boundary)` using `@turf/centroid`
5. Update `endpoints.js` with new endpoints
6. Backup existing database before migration

**Acceptance Criteria:**
- New columns exist in database
- `createField` accepts boundary, auto-derives lat/lng and area
- Soft delete works (DELETE → sets deleted_at)
- Restore works (PATCH → clears deleted_at)
- Circle+radius generates valid polygon

---

### Phase D: Polygon Rendering

**Duration:** 2-3 days  
**Dependencies:** Phase B + Phase C  
**Risk:** LOW  

**Tasks:**
1. Connect `StationMapCanvas` to real API (`GET /api/fields`)
2. Render all user fields as polygons on the map
3. Implement field selection (click polygon → highlight + open panel)
4. Implement bounds fitting (auto-zoom to show all fields)
5. Implement color coding by status/health
6. Implement hover tooltips (field name, crop, area)
7. Create `FieldDetailPanel.jsx` — side panel with field info
8. Create `LayerControls.jsx` — base map + overlay toggles
9. Create `MapToolbar.jsx` — tool icons
10. Implement filter bar (search, crop type, status)

**Acceptance Criteria:**
- All fields from API render as polygons
- Click polygon → opens detail panel
- Layer controls toggle overlays
- Filters narrow displayed fields
- Auto-zoom to field bounds

---

### Phase E: Field Creation

**Duration:** 3-4 days  
**Dependencies:** Phase D  
**Risk:** MEDIUM  

**Tasks:**
1. Create `PolygonEditor.jsx` — geoman integration for draw mode
2. Create `usePolygonDraw.js` — hook for vertex management
3. Implement Method A: Polygon Drawing on map
4. Create `CoordinateEntry.jsx` — manual lat/lng table input
5. Implement Method B: Manual Coordinate Entry
6. Create `RadiusGenerator.jsx` — center+radius form
7. Implement Method C: Center Point + Radius
8. Create `CreateFieldDrawer.jsx` — tabbed drawer with all 3 methods
9. Implement field details form (name, crop, growth stage, etc.)
10. Implement validation (min 3 vertices, coordinate range, etc.)
11. Wire to `POST /api/fields` API
12. Implement success/error handling

**Acceptance Criteria:**
- Method A: Draw polygon on map, save as field
- Method B: Enter coordinates in table, preview on map, save
- Method C: Enter center+radius, generate polygon, save
- All methods store as GeoJSON Polygon
- Validation prevents invalid geometries

---

### Phase F: Field Editing

**Duration:** 2-3 days  
**Dependencies:** Phase E  
**Risk:** MEDIUM  

**Tasks:**
1. Implement vertex editing in `PolygonEditor.jsx`:
   - Drag vertex → reshape polygon
   - Add vertex at midpoint
   - Remove vertex (min 3 enforcement)
   - Undo/redo stack
2. Implement manual coordinate editing (table → polygon update)
3. Implement center+radius regeneration
4. Implement metadata editing (name, crop, etc.)
5. Wire to `PUT /api/fields/:id` API
6. Implement change detection and unsaved changes warning
7. Implement concurrent edit handling

**Acceptance Criteria:**
- Drag vertex reshapes polygon in real-time
- Add/remove vertices works
- Manual coordinate editing updates polygon
- Center+radius regeneration replaces boundary
- Metadata editing saves without affecting boundary
- Unsaved changes warning on close

---

### Phase G: Field Deletion

**Duration:** 1-2 days  
**Dependencies:** Phase C  
**Risk:** LOW  

**Tasks:**
1. Implement delete confirmation dialog
2. Implement soft delete (DELETE /api/fields/:id)
3. Implement undo toast (10-second window)
4. Implement Trash view (list soft-deleted fields)
5. Implement restore from trash
6. Implement permanent delete (with cascade)
7. Implement "Empty trash" with confirmation

**Acceptance Criteria:**
- Delete → confirmation → soft delete → undo available
- Trash view shows deleted fields
- Restore works
- Permanent delete works with cascade
- Empty trash works

---

### Phase H: Testing

**Duration:** 3-4 days  
**Dependencies:** Phase E + Phase F + Phase G  
**Risk:** LOW  

**Tasks:**
1. Unit tests for `geoService.js` (circle generation, area calc, validation)
2. Unit tests for `fieldController.js` (CRUD, soft delete, centroid derivation)
3. Unit tests for `mapHelpers.js` (coordinate conversion, bounds calculation)
4. Unit tests for `fieldGeometry.js` (new utilities)
5. Component tests for `StationMapCanvas`
6. Component tests for `PolygonEditor`
7. Component tests for `CreateFieldDrawer`
8. Component tests for `FieldDetailPanel`
9. Integration test: Create field via polygon draw → verify API → verify map render
10. Integration test: Edit field boundary → verify polygon updates
11. Integration test: Delete field → verify soft delete → restore → verify
12. E2E test: Full field lifecycle (create → view → edit → delete → restore)
13. Performance test: Render 100+ field polygons
14. Cross-platform test: Web (Leaflet) + Mobile (react-native-maps)

**Acceptance Criteria:**
- All unit tests pass
- All integration tests pass
- E2E lifecycle test passes
- No performance regression with 100+ fields
- Works on web and mobile

---

### Phase I: Rollout

**Duration:** 2-3 days  
**Dependencies:** Phase H  
**Risk:** LOW  

**Tasks:**
1. Create feature flag `GIS_FIELDS_PAGE`
2. Deploy new FieldsPage behind flag (disabled by default)
3. Enable flag for dev/staging environment
4. QA testing on staging
5. Enable flag for production (gradual rollout)
6. Monitor error rates and performance
7. After 1 week: remove feature flag
8. After 2 weeks: remove `FieldsPage.legacy.jsx`

**Acceptance Criteria:**
- Feature flag controls new/old FieldsPage
- No errors in production
- User feedback positive
- Legacy code safely removed after stabilization

---

## Appendix A: New Dependencies

```jsonc
// App/package.json additions
{
  "dependencies": {
    "@geoman-io/leaflet-geoman-free": "^2.16.0"  // Polygon draw/edit toolbar
  }
}

// backend/package.json additions
{
  "dependencies": {
    "@turf/circle": "^7.1.0",      // Circle polygon generation
    "@turf/area": "^7.1.0",        // Polygon area calculation
    "@turf/centroid": "^7.1.0",    // Centroid calculation
    "@turf/boolean-valid": "^7.1.0" // Geometry validation
  }
}
```

## Appendix B: File Structure After Implementation

```
App/src/modules/station/
├── components/
│   └── gis/                          ← NEW
│       ├── StationMapCanvas.jsx       ← Main map component
│       ├── FieldPolygon.jsx           ← Field boundary renderer
│       ├── PolygonEditor.jsx          ← Draw/edit polygon tool
│       ├── CoordinateEntry.jsx        ← Manual coordinate input
│       ├── RadiusGenerator.jsx        ← Center+radius→polygon
│       ├── FieldDetailPanel.jsx       ← Side panel drawer
│       ├── CreateFieldDrawer.jsx      ← Create field drawer
│       ├── EditFieldDrawer.jsx        ← Edit field drawer
│       ├── TrashView.jsx              ← Deleted fields view
│       ├── LayerControls.jsx          ← Map layer switcher
│       ├── MapToolbar.jsx             ← Draw/measure/pan tools
│       ├── FilterBar.jsx              ← Search and filters
│       ├── DynamicLegend.jsx          ← Color legend
│       └── ConfirmationDialog.jsx     ← Delete confirm dialog
├── hooks/
│   ├── useFieldGIS.js                 ← GIS interaction hook
│   ├── usePolygonDraw.js              ← Drawing hook
│   └── useFieldCRUD.js                ← Field API operations
├── stores/
│   └── fieldGISStore.js               ← Zustand GIS state
├── utils/
│   └── fieldGeometry.js               ← Geometry utilities
├── config/
│   └── featureFlags.js                ← Feature flags
├── pages/
│   ├── FieldsPage.jsx                 ← REWRITE (new GIS version)
│   └── FieldsPage.legacy.jsx          ← BACKUP (original CSS circles)
└── layout/
    ├── SoilzeProShell.jsx             ← Unchanged
    ├── Sidebar.jsx                    ← Unchanged
    └── TopHeader.jsx                  ← Unchanged

backend/src/
├── controllers/
│   └── fieldController.js             ← MODIFIED (soft delete, validation)
├── services/
│   └── geoService.js                  ← MODIFIED (circle gen, area calc)
└── scripts/
    └── migrate-fields-to-polygon.js   ← NEW (migration script)
```

## Appendix C: SoilzePro Map View Alignment

| SoilzePro Feature | CropVision Implementation | Status |
|------------------|--------------------------|--------|
| Satellite base map | OSM tiles (toggle satellite) | ✅ Planned |
| GeoJSON field boundaries | Polygon rendering via Leaflet | ✅ Planned |
| Polygon draw tool | geoman integration | ✅ Planned |
| Layer switcher | LayerControls component | ✅ Planned |
| Dynamic legend | DynamicLegend component | ✅ Planned |
| Filter bar | FilterBar component | ✅ Planned |
| Field detail drawer | FieldDetailPanel component | ✅ Planned |
| Color-coded fields | Health/status-based coloring | ✅ Planned |
| Hover tooltips | Leaflet Tooltip on hover | ✅ Planned |
| Progressive disclosure | Zoom-dependent detail levels | ✅ Planned |
| Side panel | Sliding panel on selection | ✅ Planned |
| Measurement tool | geoman measure integration | 🔜 Future |
| Heatmap overlay | Data visualization layer | 🔜 Future |
| Sensor markers | IoT sensor positions | 🔜 Future |

---

> **END OF SPECIFICATION**  
> **Status:** PLANNING — Approved for implementation after review  
> **Next Step:** Switch to ACT MODE and begin Phase B implementation