# Research & Technical Decisions: Frontend World-Class Architecture Benchmark

**Feature**: `005-frontend-architecture-benchmark`  
**Phase**: Phase 0 (Planning & Architectural Research)  
**Date**: 2026-09-12  

---

## 1. Research Topics & Key Decisions

### Decision 1: Unification of GIS Web Rendering on MapLibre GL & Deprecation of Leaflet
- **Context**: CropVision previously maintained two web mapping layers: Leaflet (`react-leaflet` in `MapWidget.jsx`) and MapLibre GL (`StationMapCanvasMapLibre.web.jsx`), plus `react-native-maps` on mobile. Leaflet relies on DOM tile elements, which struggle with rendering $>100$ vector polygons, causing DOM thrashing and high CPU usage.
- **Decision**: Unify all Web Station spatial views exclusively on **MapLibre GL** via an abstract GIS SPI (`IGISAdapter`), and deprecate/retire `react-leaflet` and `MapWidget.jsx`.
- **Rationale**:
  1. MapLibre GL utilizes hardware-accelerated WebGL/WebGPU shaders, sustaining $\ge 55\text{ FPS}$ with 5,000+ polygons.
  2. Eliminating `react-leaflet` and its CSS assets reduces the web bundle size by $\sim 380\text{KB}$.
  3. MapLibre GL supports vector tiles, GeoJSON clustering, and dynamic polygon extrusion required for enterprise agricultural telemetry.
- **Alternatives Considered**:
  - *Keep Leaflet as a fallback*: Rejected because maintaining dual web mapping stacks creates inconsistent coordinate parsing and double maintenance burden.
  - *OpenLayers*: Rejected because bundle size is larger ($> 1\text{MB}$) and React bindings are less reactive than MapLibre GL.

---

### Decision 2: Web Worker Offloading for GeoJSON & Spatial Geometry
- **Context**: In React Native Web, heavy GeoJSON parsing, polygon clipping, and NDVI color calculations run on the single JavaScript UI thread, causing UI drops and input freezing during large field loads.
- **Decision**: Introduce a dedicated Web Worker service (`spatialWorkerService.js` / `SpatialWorker.ts`) for Web Station that offloads geometry parsing, bounding-box calculation, and polygon point-in-polygon checks.
- **Rationale**:
  1. Preserves 60 FPS UI responsiveness even when processing 50,000+ vertices.
  2. Complies with Principle I (Zero UI Lag) and Principle III (Geospatial Topology).
- **Alternatives Considered**:
  - *Compute on main thread with `requestIdleCallback`*: Rejected because idle callbacks still compete for CPU time on the main thread and can delay high-priority user touch events.

---

### Decision 3: Modular File Decomposition Strategy for 24 Monolith Files
- **Context**: 24 files in `App/src` currently exceed the 300 LOC limit (e.g. `StationMapCanvasMapLibre.web.jsx` at 1,084 LOC, `ZoneEditorPage.web.jsx` at 988 LOC, `MobileZoneCultivationScreen.jsx` at 912 LOC).
- **Decision**: Decompose oversized files into clean, focused sub-modules using the **Container / Presentation Hook Pattern**:
  - Extract state, events, and side-effects into focused hooks (`useMaplibreLayers`, `useZoneEditorState`, `useMapInteractions`) $\le 150$ LOC.
  - Extract pure presentation widgets into isolated components (`MapControls`, `PolygonLayers`, `LayerLegend`, `CoordinateEditor`) $\le 200$ LOC.
  - Keep the orchestrator container $\le 250$ LOC.
- **Rationale**:
  1. Strictly enforces Rule 2.1 ($\le 300$ LOC/file, $\le 40$ LOC/function).
  2. Greatly increases unit testability since hooks and widgets can be tested independently.

---

### Decision 4: Progressive Strict TypeScript Type Annotations & Schemas
- **Context**: `App/` currently contains zero TypeScript files despite having `typescript` in `package.json`.
- **Decision**: Define pure TypeScript interface contracts in `contracts/` (e.g., `IGISAdapter.ts`, `FieldDTO.ts`, `InferenceDTO.ts`), and progressively enable typed validation across core stores without breaking existing `.jsx` components.
- **Rationale**:
  1. Satisfies Rule 2.2 (Strict Typing).
  2. Eliminates undefined property access bugs when passing GeoJSON features across components.

---

### Decision 5: Adversarial Inversion Testing Strategy to Reach $\ge 90\%$ Coverage
- **Context**: Current frontend coverage is only 3.18% (17 tests). Governance mandates $\ge 90\%$ test coverage (Rule 2.4).
- **Decision**: Implement comprehensive Jest test suites targeting the **5-Dimension Inversion Test Matrix** (Rule 2.12):
  1. Degenerate GIS inputs (collinear polygons, 0-area points, inverted coordinates).
  2. Concurrency storms (rapid offline mutation spam, race conditions in sync queue).
  3. State desynchronization (network dropouts mid-sync, storage quota limits).
  4. Memory leaks and unreleased tile subscriptions.
- **Rationale**:
  1. Directly elevates test coverage past the 90% gate.
  2. Proves resilience against real-world field conditions.
