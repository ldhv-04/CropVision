# CropVision — Knowledge Base

> Auto-generated technical reference for all backend modules, database schema, and API endpoints.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  Mobile App (Expo/React Native)  │  Station Admin Dashboard    │
│  - MapView + polygon overlays    │  - Mapbox GL / Deck.gl      │
│  - GPS boundary walk streaming   │  - Incident ledger          │
└────────────────────┬────────────┴──────────────┬────────────────┘
                     │  REST API                 │  REST API
                     ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LAYER                                │
│  Express.js Backend (Node.js)                                   │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────────────┐  │
│  │ GeoService    │ │ EpidemicServ. │ │ MockMetricService      │  │
│  │ (Validation)  │ │ (Cone Model)  │ │ (Sinusoidal Telemetry) │  │
│  └──────────────┘ └───────────────┘ └────────────────────────┘  │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────────────┐  │
│  │ WalkService   │ │ DiseaseServ.  │ │ AI Core (FastAPI)      │  │
│  │ (GPS → Geo)   │ │ (Knowledge)   │ │ (YOLOv8 Inference)     │  │
│  └──────────────┘ └───────────────┘ └────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │  pg Pool (raw SQL)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  PostgreSQL 16 (Docker)                                         │
│  - GeoJSON boundary storage (JSONB)                             │
│  - Compound indexes for time-series metrics                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

| Table | Purpose | ID Type |
|-------|---------|---------|
| `users` | User accounts (farmer, station_admin) | SERIAL |
| `fields` | Farm plots with GeoJSON boundary | UUID |
| `sub_zones` | Sub-plots within fields (crop, status) | SERIAL |
| `zone_metrics` | Time-series telemetry per sub-zone | SERIAL |
| `disease_reports` | Disease occurrences in sub-zones | SERIAL |
| `zone_alerts` | Epidemic broadcast notifications | SERIAL |
| `gps_walks` | GPS walk sessions for boundary mapping | SERIAL |
| `crop_samples` | YOLO inference input images | SERIAL |
| `inference_results` | YOLO detection results | SERIAL |
| `crop_diseases` | Disease knowledge base | SERIAL |
| `treatment_methods` | Treatment options per disease | SERIAL |
| `pesticides` | Pesticide products | SERIAL |
| `alerts` | Station-wide admin alerts | SERIAL |
| `chat_sessions` | AI chat sessions | SERIAL |
| `chat_messages` | AI chat messages | SERIAL |
| `field_activities` | Field activity timeline | SERIAL |
| `weather_cache` | Cached weather data | Composite |

### Key Relationships

```
users (1) ──→ (N) fields (UUID)
fields (1) ──→ (N) sub_zones (FK: field_id UUID)
sub_zones (1) ──→ (N) zone_metrics (FK: sub_zone_id)
sub_zones (1) ──→ (N) disease_reports (FK: sub_zone_id)
disease_reports (1) ──→ (N) zone_alerts (FK: disease_report_id)
fields (1) ──→ (N) gps_walks (FK: field_id UUID)
fields (1) ──→ (N) field_activities (FK: field_id UUID)
```

### Sub-Zone Status Flow
```
HEALTHY ──→ WARNING (when nearby zone reports disease)
WARNING ──→ INFECTED (when disease confirmed in zone)
INFECTED ──→ HEALTHY (when disease report resolved)
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/auth/verify-email` | No | Verify email with OTP |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Fields (`/api/fields`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/fields` | Yes | List user's fields (optional `?zone_status=HEALTHY\|WARNING\|INFECTED`) |
| POST | `/api/fields` | Yes | Create field with GeoJSON boundary |
| GET | `/api/fields/:id` | Yes | Get field detail + activities |
| PUT | `/api/fields/:id` | Yes | Update field (boundary, growth_stage) |
| DELETE | `/api/fields/:id` | Yes | Delete field |
| POST | `/api/fields/:id/activities` | Yes | Add activity to field |
| GET | `/api/fields/:id/activities` | Yes | List activities for field |

### Sub-Zones (`/api/fields/:fieldId/subzones` + `/api/subzones`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/fields/:fieldId/subzones` | Yes | List sub-zones with latest metrics |
| POST | `/api/fields/:fieldId/subzones` | Yes | Create sub-zone (validates boundary containment) |
| GET | `/api/subzones/:id` | Yes | Get sub-zone detail + metric history |
| PUT | `/api/subzones/:id` | Yes | Update sub-zone (boundary, status, crop) |
| DELETE | `/api/subzones/:id` | Yes | Delete sub-zone |
| GET | `/api/subzones/:id/metrics` | Yes | Get live simulated telemetry (saves to DB) |

### GPS Boundary Walk (`/api/fields/:fieldId/walk`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fields/:fieldId/walk/start` | Yes | Start GPS walk session |
| GET | `/api/fields/:fieldId/walk/:walkId` | Yes | Get walk status + collected points |
| PATCH | `/api/fields/:fieldId/walk/:walkId/points` | Yes | Append GPS points (bulk) |
| POST | `/api/fields/:fieldId/walk/:walkId/complete` | Yes | Complete walk → save GeoJSON boundary |

**Frontend Endpoint Constants (`ENDPOINTS.walk`):**
```js
walk: {
  start:    (fieldId) => `/api/fields/${fieldId}/walk/start`,
  status:   (fieldId, walkId) => `/api/fields/${fieldId}/walk/${walkId}`,
  points:   (fieldId, walkId) => `/api/fields/${fieldId}/walk/${walkId}/points`,
  complete: (fieldId, walkId) => `/api/fields/${fieldId}/walk/${walkId}/complete`,
}
```

### Epidemic & Disease (`/api/epidemic`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/epidemic/report` | Yes | Report disease → compute cone → broadcast alerts |
| POST | `/api/epidemic/simulate` | Yes | Preview simulation with custom wind (no DB writes) |
| GET | `/api/epidemic/alerts` | Yes | Get user's epidemic alerts |
| PATCH | `/api/epidemic/alerts/:id/read` | Yes | Mark alert as read |
| PATCH | `/api/epidemic/reports/:id/resolve` | Yes | Resolve disease report |
| GET | `/api/epidemic/outbreaks` | Yes | List active outbreaks (station dashboard) |
| GET | `/api/epidemic/outbreaks/:id` | Yes | Get outbreak detail with affected zones |

### AI Inference (`/api`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/infer` | Yes | Upload image → YOLO detection |
| GET | `/api/history` | Yes | Get inference history |

### Disease Knowledge (`/api/diseases`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/diseases/:class` | Yes | Get disease info by YOLO class |
| GET | `/api/diseases/search` | Yes | Search diseases by keyword |

### Weather (`/api/weather`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/weather` | Yes | Get weather for coordinates |

### Chat (`/api/chat`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | Yes | Send message to AI chatbot |
| GET | `/api/chat/history` | Yes | Get chat history |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/stats` | Admin | System statistics |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |

### Alerts (`/api/alerts`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/alerts` | Yes | Get active alerts |
| POST | `/api/alerts` | Admin | Create alert |
| POST | `/api/alerts/:id/acknowledge` | Yes | Acknowledge alert |

---

## Services

### GeoService (`backend/src/services/geoService.js`)
- `validateSubZone(outerBoundary, subZoneBoundary)` — Checks if sub-zone polygon is entirely within field boundary using `@turf/boolean-within`. Supports Polygon + MultiPolygon.
- `validateGeoJsonPolygon(geoJson)` — Validates GeoJSON structure (Polygon or MultiPolygon).
- `buildTurfGeometry(boundary)` — Builds Turf.js feature from GeoJSON boundary.

### EpidemicService (`backend/src/services/epidemicService.js`)
- `calculateInfectedCone(epicenter, windDirection, distanceRadius)` — Builds a 45° dispersion cone polygon downwind from the infected epicenter using `@turf/destination`.
- `scanZonesInDanger(conePolygon, allSubZones)` — Filters zones that intersect the danger cone using `@turf/boolean-intersects`. Supports Polygon + MultiPolygon.
- `computePolygonCentroid(boundary)` — Computes arithmetic centroid of GeoJSON geometry.

### MockMetricService (`backend/src/services/mockMetricService.js`)
- `generateMetrics(status)` — Generates sinusoidal diurnal telemetry (HEALTHY/WARNING/INFECTED profiles).
- `getStationWeatherMock()` — Returns deterministic weather data (SE wind, 5.4 m/s, 29.5°C).

### DiseaseService (`backend/src/services/diseaseService.js`)
- `getDiseaseByClass(class)` — Lookup disease info by YOLO class name.
- `getTopDiseases(detections, topK)` — Get top-N diseases from inference results.
- `buildDiseaseContext(disease)` — Build LLM context string for chatbot.

---

## Geospatial Standards

- **All coordinates follow GeoJSON `[Longitude, Latitude]` convention.**
- Field boundaries stored as GeoJSON `Polygon` or `MultiPolygon` in JSONB.
- Sub-zone boundaries stored as GeoJSON `Polygon` in JSONB.
- Containment validation uses `@turf/boolean-within` (ray-casting algorithm).
- Cone dispersion uses `@turf/destination` for bearing projection.
- Intersection checking uses `@turf/boolean-intersects`.

### MultiPolygon Support
Both `GeoService` and `EpidemicService` accept `Polygon` and `MultiPolygon` for:
- Field boundaries (outerBoundary)
- Sub-zone boundaries
- GPS walk completion can merge new walk into existing MultiPolygon

---

## Scripts

| Script | Purpose |
|--------|---------|
| `node run-migration.js` | Run all schema migrations (creates tables + indexes) |
| `node run-seed.js` | Seed disease knowledge base (treatments, pesticides) |
| `node run-seed-v2.js` | Extended seed data |
| `node run-seed-geo.js` | Seed geo-spatial test data (1 field, 3 sub-zones, 15 metrics) |
| `node run-seed-bulk.js` | Load test: 100 fields, 10K sub-zones, 1M metrics + index benchmark |

---

## Docker Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `db` | `cropvision-db` | 5432 | PostgreSQL 16 |
| `ai_core` | `cropvision-ai-core` | 8000 | FastAPI + YOLOv8 |
| `backend` | `cropvision-backend` | 3000 | Express.js API |

---

## Dependencies (Geo-Epidemic Module)

```
@turf/boolean-within    — Polygon containment check
@turf/boolean-intersects — Polygon intersection check
@turf/helpers           — GeoJSON feature builders (polygon, multiPolygon, point)
@turf/destination       — Point projection by bearing + distance
```

---

## Indexes (Performance-Critical)

```sql
idx_zone_metrics_sub_zone_created  -- (sub_zone_id, created_at DESC) for latest metric query
idx_sub_zones_field_id             -- (field_id) for field→sub-zone joins
idx_disease_reports_sub_zone_id    -- (sub_zone_id) for zone→disease joins
idx_zone_alerts_disease_report_id  -- (disease_report_id) for outbreak→alert joins
idx_gps_walks_field_id             -- (field_id) for walk session lookup
```

---

## Migration Order

1. `001-init.sql` — users, crop_samples, inference_results (run by Docker init)
2. `002-chat.sql` — chat_sessions, chat_messages (run by Docker init)
3. `003-diseases.sql` — disease-related tables (run by Docker init)
4. `run-migration.js` — All other tables + columns (run manually after Docker)
5. `005-geo-epidemic.sql` — Reference file only (content already in run-migration.js)