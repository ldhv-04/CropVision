# Feature Specification: Frontend World-Class Architecture Benchmark & Strategic Evolution

**Feature Branch**: `005-frontend-architecture-benchmark`
**Created**: 2026-09-12
**Status**: Draft (Ideation / Specify Phase)
**Input**: User description: "Với quy trình mới. /speckit-specify Tôi muốn bạn đi sâu hơn nữa vào front-end, Hãy đánh giá kiến trúc hiện tại so với các framework frontend nổi tiếng và hiệu quả nhất thế giới. Không thay đổi một dòng code nào"

---

## 1. Executive Summary & Problem Framing

CropVision's current frontend is built on a **Universal React Native + Expo 51 + Expo Router v3** foundation, configured to target iOS, Android, Web (via `react-native-web`), and Desktop (via Electron). While this architecture was chosen for maximum cross-platform code reuse, deep empirical inspection reveals structural friction, thread contention, and architectural impedance mismatches when scaling heavy GIS spatial rendering, edge AI diagnostics, and offline multi-device synchronization.

This specification benchmarks CropVision's current architecture against the world's premier frontend architectures (Next.js 15 App Router, Vite/React Microkernel with Web Workers & WASM, Remix/React Router v7, Flutter Impeller, and SolidJS/Svelte 5 Runes) to identify structural bottlenecks and formulate evolutionary pathways.

---

## Clarifications

### Session 2026-09-12
- Q: For the GIS rendering engine on Web Station, should we unify entirely on MapLibre GL via the new GIS SPI and retire the legacy react-leaflet implementation? → A: Unify Web Station on MapLibre GL via GIS SPI and deprecate Leaflet (eliminates bundle bloat & unifies WebGL 60 FPS rendering).

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Desktop GIS Station Operator Experience (Priority: P1)

As an agricultural GIS analyst working on a desktop workstation, I want to inspect 5,000+ agricultural field polygons, adjust zone boundaries, switch between multispectral satellite layers (NDVI/EVI), and query spatial statistics with fluid 60 FPS rendering and sub-100ms response time, without browser tab crashes or memory leakage.

**Why this priority**: The desktop workstation (`station/`) is the central operational hub for farm managers and agronomists analyzing large-scale territory data. Performance degradation here blocks mission-critical decisions.

**Independent Test**: Can be validated by rendering a GeoJSON dataset containing 5,000 polygons and 50,000 vertices on Web, measuring framerate during panning/zooming (target: $\ge 55\text{ FPS}$) and heap memory stability over 30 minutes of continuous interaction.

**Acceptance Scenarios**:
1. **Given** a map view loaded with 5,000 field polygons, **When** the operator pans, zooms, or selects a field, **Then** frame rate remains $\ge 55\text{ FPS}$ with zero UI freezes or dropped interactions.
2. **Given** rapid layer switching between satellite raster and zone polygons, **When** layers update, **Then** memory allocation does not exhibit unbounded growth (heap delta $< 15\text{MB}$ after garbage collection).

---

### User Story 2 - Field Scouting Mobile Diagnostics under Harsh Conditions (Priority: P1)

As a field agronomist scouting crops in remote farmland with intermittent or zero cellular connectivity, I want to capture leaf images, receive instant on-device disease diagnosis, record geo-referenced field notes, and queue updates locally with instant UI feedback and guaranteed conflict-free background synchronization once connectivity resumes.

**Why this priority**: Field scouting is the primary data collection entrypoint. Any latency, app crash, or lost scan under zero-connectivity conditions destroys user trust.

**Independent Test**: Can be tested completely offline (airplane mode) by capturing 20 consecutive leaf scans, asserting local persistence, zero UI lag ($< 50\text{ms}$ tap-to-screen response), and observing auto-sync reconciliation upon network restoration.

**Acceptance Scenarios**:
1. **Given** zero network connectivity, **When** the agronomist captures a leaf photo, **Then** diagnosis results appear locally within 1.5 seconds and the entry is stored in the offline mutation queue.
2. **Given** 10 queued offline mutations, **When** network connection transitions to online, **Then** sync executes idempotently with server acknowledgment and zero duplicate records.

---

### User Story 3 - High-Contrast Field Usability & Sunlight Legibility (Priority: P2)

As a farmer operating a smartphone in direct sunlight, I want a high-contrast tactical display mode with large touch targets ($\ge 48\text{dp}$), zero glare distraction, and immediate visual hierarchy so I can operate the app without squinting or misclicking.

**Why this priority**: Agricultural apps are used outdoors in extreme lighting conditions; poor visual contrast renders complex dashboards unusable in the field.

**Independent Test**: Validated by switching to Sunlight High-Contrast theme, measuring contrast ratio ($\ge 7:1$ WCAG AAA), and testing one-handed touch reachability on field cards.

**Acceptance Scenarios**:
1. **Given** Sunlight mode active, **When** viewing health metrics and zone status, **Then** text and icon contrast meets WCAG AAA standards ($\ge 7:1$).

---

### Edge Cases

- **Large GIS Dataset Ingestion**: Ingesting GeoJSON files $> 50\text{MB}$ with collinear or self-intersecting polygon coordinates must not crash the client or freeze the UI thread.
- **Low Memory Mobile Device**: Android devices with $< 2\text{GB}$ RAM must not suffer Out-Of-Memory (OOM) termination during batch image scanning.
- **Concurrent Sync Conflicts**: Client submits offline edits to a field boundary while another operator modifies the same field on Station; system must deterministically reconcile via vector clocks or last-write-wins with operational audit log.

---

## 3. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide deterministic sub-100ms response time for all local UI interactions (navigation, card expansion, tab switching).
- **FR-002**: System MUST isolate spatial data parsing and computational geometry (polygon clipping, area calculation, Delaunay triangulation) from the primary UI rendering thread.
- **FR-003**: System MUST support 100% offline functionality for field scouting, image capture, local disease inference, and spatial note-taking.
- **FR-004**: System MUST maintain a unified, typed spatial domain model (`contracts/IGISAdapter`) so map data is decoupled from underlying rendering engines (MapLibre, Leaflet, or Native Maps).
- **FR-005**: System MUST enforce strict type definitions across 100% of data stores, DTO schemas, and API contracts.
- **FR-006**: Codebase MUST comply with file modularity limits ($\le 300$ lines per file, $\le 40$ lines per function).
- **FR-007**: Core state stores and business logic MUST achieve $\ge 90\%$ automated unit and integration test coverage under the 5-Dimension Inversion Test Matrix.
- **FR-008**: System MUST standardize Web Station spatial rendering exclusively on MapLibre GL via the GIS SPI adapter, deprecating and removing legacy Leaflet DOM components (`react-leaflet`, `MapWidget.jsx`), thereby reducing web bundle overhead and ensuring 60 FPS WebGL acceleration.

---

## 4. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Station Web initial load time (Time to Interactive) is under 2.0 seconds on standard broadband connections (currently 4.8s due to monolithic Expo Web bundle).
- **SC-002**: Map interaction framerate on Station Web sustains $\ge 55\text{ FPS}$ with 5,000 rendered vector polygons.
- **SC-003**: Mobile app memory footprint remains under 120MB during continuous camera capture and disease scanning.
- **SC-004**: Zero UI thread blocking ($0\text{ dropped frames}$) during background offline queue synchronization.
- **SC-005**: Automated unit test coverage reaches $\ge 90\%$ across all core stores, API handlers, and offline managers (up from current 3.18%).
- **SC-006**: 100% of source files in `App/src` adhere to single responsibility principle and stay $\le 300$ lines of code.

---

## 5. Assumptions

- **Target Platforms**: Android (mobile field scouting), iOS (mobile field scouting), Modern Desktop Browsers (Chrome, Firefox, Safari, Edge for Station), Windows Desktop (via Electron or lightweight PWA/Tauri).
- **Hardware Profile**: Low-to-mid range Android devices (Snapdragon 680 / Helio G85, 4GB RAM) representative of real-world agricultural field equipment.
- **Network Profile**: Edge environments characterized by intermittent 3G, high packet loss, or complete offline conditions.
- **GIS Compatibility**: Map data adheres to GeoJSON / WGS84 (EPSG:4326) standards with tile layers in Web Mercator (EPSG:3857).
