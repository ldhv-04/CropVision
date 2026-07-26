# Frontend Module Boundaries

Ownership classification for every source root under `App/`. Enforced by
`App/__tests__/architectureBoundary.test.js`.

## Ownership map

| Root | Owner class | Notes |
|---|---|---|
| `App/app/**` | Application composition | Expo Router addresses; several Agrivision routes still own feature code (see roadmap P2) |
| `App/src/modules/station/**` | Station business module | Public entry `station/index.js`; `shell/` + `widgets/GridShell/` are frozen compatibility |
| `App/src/modules/agrivision/**` | Agrivision business module | Public entry `agrivision/index.js`; `shell/` + `widgets/GridShell/` are frozen compatibility |
| `App/src/modules/inference/**` | Inference module | Public entry `inference/index.js`; field context supplied by owning routes as a prop |
| `App/src/modules/@core/auth/**` | Authentication | Session token authority |
| `App/src/modules/@core/api/**` | Platform (transport) | No auth-store import; reads injected session provider |
| `App/src/modules/@core/session/**` | Platform | Neutral session provider seam |
| `App/src/modules/@core/{constants,context,components/AppShell}` | Shared (neutral UI) | Theme, app shell primitives |
| `App/src/modules/@core/components/{GridShell,MapShell,MapSidebar,MapDetailDrawer,TimelineScrubber}` | Compatibility (frozen) | No new consumers |
| `App/src/modules/@core/store/useMapStore.js` | Compatibility (frozen family) | Admin-domain state consumed only by frozen Map* components and legacy MapWidget |
| `App/src/modules/platform/**` | Platform | Runtime detection, image picker, layout mode |
| `App/src/modules/legacy/GridShell/**` | Compatibility (frozen) | Wide-web shell; registries pinned by test |
| `App/src/modules/{admin,history,landing}/**` | Business modules (small) | Admin/history reached via `(main)` + Station alerts; landing is auth surface |
| ~~`App/src/components/AdminPanel/**`, `App/src/config/api.js`, `App/src/constants/theme.js`~~ | Removed (S12) | Confirmed dead and deleted; see dead-code register |
| `App/__tests__/**`, `App/e2e/**` | Tests | — |
| `App/electron/**` | Platform (desktop host) | Main/preload/static server; outside module graph |

## Module edge table (cross-boundary edges at audit)

| From | To | Edge | Active runtime | Allowed | Evidence | Action |
|---|---|---|---|---|---|---|
| inference `InferenceActionPanel` | agrivision `store/useFieldStore` | — removed in S2 (`acb13d6`): field context is now a prop from the owning route | P0 mobile | resolved | commit diff | done |
| Agrivision routes | agrivision public entry `agrivision/index.js` | import | P0 mobile | valid composition | S5–S10 commits | done |
| Station routes + web layout | station public entry `station/index.js` | import | P0 desktop | valid composition | S4 commit `12284b7` | done |
| inference/diagnosis routes | inference public entry `inference/index.js` | import | P0 mobile | valid composition | S7 commit `5c68ddd` | done |
| `(agrivision)/_layout.js` | agrivision `shell` | lazy require | P3 wide web | frozen compatibility | `COMPATIBILITY_CONSUMER_ALLOWLIST` | keep; no growth |
| `(main)/_layout.js` | `@core/components/GridShell` | lazy require | legacy web | frozen compatibility | same | keep; no growth |
| legacy GridShell widgets | station/agrivision `widgets/GridShell/*` | import | P3 wide web | frozen compatibility | `OWNER_PRIVATE_ALLOWLIST` | keep until L6 retirement |
| `(main)/alerts.js` | admin `AlertsAdminScreen` | import | legacy web | transitional (allowlist) | `ROUTE_MODULE_ALLOWLIST` | remaining legacy edge; `(station)` alerts now uses the Station public entry |
| `(main)/history.js` | history `SampleList` | import | legacy web | transitional (allowlist) | same | document |
| frozen Map* components | `@core/store/useMapStore` | import | unrouted | frozen compatibility | consumer grep | contain via compatibility root rule |

Forbidden directions (station↔agrivision, neutral→owner, transport→auth) have zero edges;
enforced by the boundary suite.
