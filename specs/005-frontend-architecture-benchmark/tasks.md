# Tasks: Frontend World-Class Architecture Modernization

**Feature**: `005-frontend-architecture-benchmark`  
**Status**: Ready for Implementation  
**Created**: 2026-09-12  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  

---

## Phase 1: Setup & Architectural Foundations

**Purpose**: Establish pure TypeScript contracts and spatial infrastructure

- [x] T001 [P] Copy GIS SPI contract to `App/src/modules/@core/contracts/IGISAdapter.ts`
- [x] T002 [P] Create domain type definitions in `App/src/modules/@core/contracts/FieldDTO.ts`
- [x] T003 [P] Create offline mutation schemas in `App/src/modules/@core/contracts/OfflineDTO.ts`

---

## Phase 2: Foundational (Core Adapters & GIS Infrastructure)

**Purpose**: Core GIS SPI implementation and spatial offloading

- [x] T004 Implement MapLibreGLAdapter implementing IGISAdapter in `App/src/modules/station/adapters/MapLibreGLAdapter.js`
- [x] T005 [P] Implement NativeMapsAdapter implementing IGISAdapter in `App/src/modules/agrivision/adapters/NativeMapsAdapter.js`
- [x] T006 [P] Create spatial calculation helper in `App/src/modules/@core/utils/spatialCalculations.js`
- [x] T007 Implement adversarial GIS tests in `App/__tests__/gisAdapterInversion.test.js`

**Checkpoint**: Core GIS SPI and adapters verified with automated tests.

---

## Phase 3: User Story 1 - Desktop GIS Station Operator Experience (Priority: P1) 🎯 MVP

**Goal**: Deliver fluid 60 FPS Web Station GIS map rendering, eliminate `react-leaflet`, and modularize oversized station files to $\le 300$ LOC.

**Independent Test**: Web Station loads with MapLibre GL, pans/zooms 5,000 polygons without UI thread lag, and all station files stay $\le 300$ LOC.

### Tests for User Story 1
- [x] T008 [P] [US1] Unit test for MapLibreGLAdapter layer management in `App/__tests__/mapLibreAdapter.test.js`
- [x] T009 [P] [US1] Integration test for station field loading in `App/__tests__/stationFieldsIntegration.test.js`

### Implementation for User Story 1
- [x] T010 [US1] Decompose `StationMapCanvasMapLibre.web.jsx` (1,084 LOC) into `StationMapCanvasMapLibre.web.jsx` (<=250 LOC) and subcomponents in `App/src/modules/station/components/gis/canvas/`
- [x] T011 [US1] Decompose `ZoneEditorPage.web.jsx` (988 LOC) into `ZoneEditorPage.web.jsx` (<=250 LOC) and subcomponents in `App/src/modules/station/pages/zoneEditor/`
- [x] T012 [US1] Decompose `FieldsPage.jsx` (683 LOC) into `FieldsPage.jsx` (<=250 LOC) and subcomponents in `App/src/modules/station/pages/fields/`
- [x] T013 [US1] Decompose `DashboardPage.jsx` (547 LOC) into `DashboardPage.jsx` (<=250 LOC) and widgets in `App/src/modules/station/pages/dashboard/`
- [x] T014 [US1] Decompose `CreateFieldDrawer.jsx` (548 LOC) in `App/src/modules/station/components/gis/CreateFieldDrawer.jsx`
- [x] T015 [US1] Retire legacy `react-leaflet` dependencies and `MapWidget.jsx` in `App/src/modules/agrivision/widgets/GridShell/MapWidget.jsx`

**Checkpoint**: User Story 1 complete, Web Station 100% modular and 60 FPS capable.

---

## Phase 4: User Story 2 - Field Scouting Mobile Diagnostics (Priority: P1)

**Goal**: Ensure 100% offline mobile resilience, sub-100ms camera and leaf scan diagnostics, and modularize mobile screens to $\le 300$ LOC.

**Independent Test**: Capture 20 offline scans, verify local persistence, verify zero UI thread lag, and verify idempotent sync on reconnect.

### Tests for User Story 2
- [x] T016 [P] [US2] Offline queue concurrency stress test in `App/__tests__/offlineQueueStress.test.js`
- [x] T017 [P] [US2] Inference store state machine test in `App/__tests__/inferenceStore.test.js`

### Implementation for User Story 2
- [x] T018 [US2] Decompose `MobileZoneCultivationScreen.jsx` (912 LOC) in `App/src/modules/agrivision/screens/MobileZoneCultivationScreen.jsx`
- [x] T019 [US2] Decompose `diagnosis-result.js` (825 LOC) in `App/app/(agrivision)/diagnosis-result.js`
- [x] T020 [US2] Decompose `useInferenceStore.js` (525 LOC) in `App/src/modules/inference/store/useInferenceStore.js`
- [x] T021 [US2] Decompose `LeafScanTab.jsx` (458 LOC) in `App/src/modules/agrivision/screens/LeafScanTab.jsx`
- [x] T022 [US2] Decompose `CameraModal.js` (353 LOC) in `App/src/modules/agrivision/components/CameraModal.js`

**Checkpoint**: User Story 2 complete, mobile diagnosis is resilient and modular.

---

## Phase 5: User Story 3 - High-Contrast Field Usability & Sunlight Legibility (Priority: P2)

**Goal**: Provide WCAG AAA $\ge 7:1$ high-contrast tactical sunlight mode for outdoor field scouting.

**Independent Test**: Switch to Sunlight mode, verify contrast tokens meet $\ge 7:1$, and verify touch targets $\ge 48\text{dp}$.

### Tests for User Story 3
- [x] T023 [P] [US3] Contrast ratio token verification test in `App/__tests__/themeContrast.test.js`

### Implementation for User Story 3
- [x] T024 [US3] Update high-contrast sunlight tokens in `App/src/modules/@core/constants/theme.js`
- [x] T025 [US3] Apply high-contrast sunlight styling in `App/src/modules/agrivision/components/FieldCardPro.jsx`

---

## Phase 6: Polish & Verification Gates

**Purpose**: Test coverage gate ($\ge 90\%$) and file sizing verification

- [x] T026 Audit all files in `App/src` to confirm 100% adherence to $\le 300$ LOC limit (Rule 2.1)
- [x] T027 Run full Jest coverage suite (`npm run test:coverage`) to confirm $\ge 90\%$ coverage on modified modules
- [x] T028 Validate end-to-end quickstart scenarios per `specs/005-frontend-architecture-benchmark/quickstart.md`

---

## Dependencies & Execution Order

1. **Setup & Foundational (Phases 1-2)**: Prerequisite for all user stories.
2. **User Story 1 (Phase 3 - Web Station MVP)**: Independent of US2/US3.
3. **User Story 2 (Phase 4 - Mobile Scouting)**: Runs after Foundational.
4. **User Story 3 (Phase 5 - Sunlight Theme)**: Runs after US2.
5. **Polish & Verification (Phase 6)**: Final signoff.
