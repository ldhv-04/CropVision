# Frontend Modulith — Current State

Audited at `486071f` on branch `refactor-lab/modulith-v1`. Baseline tag `lab/baseline-484c1cc`.
Supplements the prior program audit in `docs/ops/lab-refactor/00-baseline-audit.md`; this file
reflects the tree after L1–L4A plus the post-L4A build/backend commits.

## Verified hypothesis results

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| 1 | Station web canonical is `SoilzeProShell + <Slot />` | Confirmed fact | `App/app/(station)/_layout.web.js:30` renders `SoilzeProShell` around `<Slot />`; MapShell appears only in comments |
| 2 | No direct Station↔Agrivision business imports | Confirmed fact | `architectureBoundary.test.js` cross-owner rule passes; grep finds none |
| 3 | Agrivision holds overlapping field collections | Confirmed fact | `store/useFieldStore`, `store/useMobileFieldStore`, `stores/fieldStore` each own a `fields` array with separate fetchers |
| 4 | Agrivision route files contain feature implementation | Confirmed fact | `app/(agrivision)/index.js` 854 lines, `diagnosis-result.js` 825, `encyclopedia.js` 676, `chat.js` 202, `settings.js` 198 |
| 5 | `InferenceActionPanel` reaches Agrivision private state via `require` | Confirmed fact | `src/modules/inference/components/InferenceActionPanel.js:19` fixed-string `require('../../agrivision/store/useFieldStore')` |
| 6 | `@core/store/useMapStore` contains admin-domain behavior | Confirmed fact | `useMapStore.js:46` fetches `ENDPOINTS.admin.statsDiseases` |
| 7 | `AgrivisionShell -> GridShell -> legacy/GridShell` active on wide web | Confirmed fact | `AgrivisionShell.jsx:8` imports `@core/components/GridShell`; that index re-exports `legacy/GridShell/index`; `(agrivision)/_layout.js:19` loads it at width > 768 on web |
| 8 | `StationShell -> MapShell` frozen and unconsumed by routes | Confirmed fact | Only importer of `station/shell` is `station/index.js` (public re-export); no route uses the Station public entry yet |
| 9 | Enforcement relies on allowlisted Jest boundary test | Confirmed fact | `App/__tests__/architectureBoundary.test.js`: 9 rules, 3 allowlist Sets (37 owner-private, 15 route-module, 2 compatibility edges) |
| 10 | Some apparent dead code unproven | Confirmed fact | `src/components/AdminPanel/**`, `src/config/api.js`, `src/constants/theme.js` have zero static importers; see dead-code register |

## Runtime graphs

### Station web / Electron (P0 desktop)
```text
electron/launch.js -> electron/main.js -> preload.js (electronAPI bridge) -> Expo web renderer
app/_layout.js (auth rehydrate, Stack)
  -> app/index.js (role redirect)
  -> /(station) alias routes -> /station/*
  -> app/(station)/_layout.web.js (auth+role gate, ThemeProvider)
     -> SoilzeProShell + <Slot />
        -> app/(station)/station/*.js  (thin re-exports)
           -> station/pages/*Page.jsx -> station/stores/fieldGISStore, station hooks/services
```
Native fallback: `(station)/_layout.js` renders a "web only" notice; `FieldsPage.native.jsx` keeps
the MapLibre stack off native bundles.

### Agrivision native (P0 mobile)
```text
app/_layout.js -> app/index.js -> /(agrivision)
  -> app/(agrivision)/_layout.js (Tabs, CameraModal, auth gate; narrow layout)
     -> index.js        (854-line home implementation; useFieldStore + useSubZoneStore + direct API)
     -> fields.js       -> MobileFieldsScreen        -> useMobileFieldStore
     -> field-detail/[fieldId].js -> MobileFieldDetailScreen -> useMobileFieldStore
     -> field-detail/[fieldId]/cultivation/[zoneId].js -> MobileZoneCultivationScreen -> useMobileCultivationStore
     -> field-map.js    -> FieldMapScreen            -> stores/fieldStore + fieldMapStore + metricStore (via hooks)
     -> zone-detail.js  -> ZoneDetailScreen          -> stores/metricStore
     -> inference.js    -> InferenceLayout           -> useInferenceStore (+ useFieldStore for context)
     -> diagnosis-result.js (825-line implementation) -> useInferenceStore + direct API
     -> encyclopedia.js / chat.js / settings.js (route-owned implementations, direct API)
```

### Agrivision wide web (P3 compatibility, no growth)
```text
(agrivision)/_layout.js [width > 768, web] -> AgrivisionShell -> @core GridShell -> legacy/GridShell
  -> compat contentRegistry/menuRoutes -> owner widgets (station + agrivision widgets/GridShell)
```

### Legacy `(main)` group (compatibility)
```text
app/(main)/_layout.js -> redirects for admin/dashboard/analysis
  web: @core GridShell (legacy)   mobile: @core AppShell + <Slot />
  routes: alerts.js -> admin/AlertsAdminScreen, history.js -> history/SampleList
```

### Unrouted frozen composition
`StationShell -> MapShell (+ MapSidebar, MapDetailDrawer, TimelineScrubber) -> useMapStore`.
Reachable only through the Station public entry export; no route consumes it.

## Verification baseline at audit

| Check | Result |
|---|---|
| `npm ci` | PASS |
| `npm test -- --runInBand` | PASS (3 suites, 12 tests) |
| `npx tsc --noEmit` | PASS |
| Architecture boundary suite | PASS |
| Electron / Android / authenticated journeys | Environment-blocked (see `docs/ops/lab-refactor/decision-and-exception-log.md` D-002, D-004) |
