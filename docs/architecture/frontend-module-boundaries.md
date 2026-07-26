# Frontend Module Boundaries

Ownership classification for every source root under `App/`. Enforced by
`App/__tests__/architectureBoundary.test.js`.

## Ownership map

| Root | Owner class | Notes |
|---|---|---|
| `App/app/**` | Application composition | Expo Router addresses; several Agrivision routes still own feature code (see roadmap P2) |
| `App/src/modules/station/**` | Station business module | Public entry `station/index.js`; `shell/` + `widgets/GridShell/` are frozen compatibility |
| `App/src/modules/agrivision/**` | Agrivision business module | Public entry planned (`agrivision/index.js`); `shell/` + `widgets/GridShell/` are frozen compatibility |
| `App/src/modules/inference/**` | Inference module | Field context currently reaches into Agrivision private store (P0-1) |
| `App/src/modules/@core/auth/**` | Authentication | Session token authority |
| `App/src/modules/@core/api/**` | Platform (transport) | No auth-store import; reads injected session provider |
| `App/src/modules/@core/session/**` | Platform | Neutral session provider seam |
| `App/src/modules/@core/{constants,context,components/AppShell}` | Shared (neutral UI) | Theme, app shell primitives |
| `App/src/modules/@core/components/{GridShell,MapShell,MapSidebar,MapDetailDrawer,TimelineScrubber}` | Compatibility (frozen) | No new consumers |
| `App/src/modules/@core/store/useMapStore.js` | Compatibility (frozen family) | Admin-domain state consumed only by frozen Map* components and legacy MapWidget |
| `App/src/modules/platform/**` | Platform | Runtime detection, image picker, layout mode |
| `App/src/modules/legacy/GridShell/**` | Compatibility (frozen) | Wide-web shell; registries pinned by test |
| `App/src/modules/{admin,history,landing}/**` | Business modules (small) | Admin/history reached via `(main)` + Station alerts; landing is auth surface |
| `App/src/components/AdminPanel/**`, `App/src/config/api.js`, `App/src/constants/theme.js` | Dead-code candidates | Zero static importers; see dead-code register |
| `App/__tests__/**`, `App/e2e/**` | Tests | — |
| `App/electron/**` | Platform (desktop host) | Main/preload/static server; outside module graph |

## Module edge table (cross-boundary edges at audit)

| From | To | Edge | Active runtime | Allowed | Evidence | Action |
|---|---|---|---|---|---|---|
| inference `InferenceActionPanel` | agrivision `store/useFieldStore` | fixed `require()` | P0 mobile | transitional | `InferenceActionPanel.js:19` | P0-1: replace with field-context provider |
| Agrivision routes (index, inference) | agrivision private stores/components | import | P0 mobile | transitional (allowlist) | `OWNER_PRIVATE_ALLOWLIST` | P2: thin routes + public entry |
| Station routes `station/*.js` | station private pages | re-export | P0 desktop | transitional (allowlist) | `OWNER_PRIVATE_ALLOWLIST` | P3: migrate to `station/index.js` |
| `(station)/_layout.web.js` | station `layout/SoilzeProShell` | import | P0 desktop | transitional (allowlist) | same | P3: expose shell via public entry |
| Agrivision fat routes | `@core/api` | import | P0 mobile | transitional (allowlist) | `ROUTE_MODULE_ALLOWLIST` | P2: move API orchestration into module services |
| `(agrivision)/_layout.js` | agrivision `shell` | lazy require | P3 wide web | frozen compatibility | `COMPATIBILITY_CONSUMER_ALLOWLIST` | keep; no growth |
| `(main)/_layout.js` | `@core/components/GridShell` | lazy require | legacy web | frozen compatibility | same | keep; no growth |
| legacy GridShell widgets | station/agrivision `widgets/GridShell/*` | import | P3 wide web | frozen compatibility | `OWNER_PRIVATE_ALLOWLIST` | keep until L6 retirement |
| `(main)/alerts.js`, `(station)/station/alerts.js` | admin `AlertsAdminScreen` | import | admin web | transitional (allowlist) | `ROUTE_MODULE_ALLOWLIST` | document; small module, low priority |
| `(main)/history.js` | history `SampleList` | import | legacy web | transitional (allowlist) | same | document |
| frozen Map* components | `@core/store/useMapStore` | import | unrouted | frozen compatibility | consumer grep | contain via compatibility root rule |

Forbidden directions (station↔agrivision, neutral→owner, transport→auth) have zero edges;
enforced by the boundary suite.
