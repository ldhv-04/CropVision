# Frontend Refactor Roadmap

Slices execute one at a time; each ends in a focused commit with tests green. Status values:
pending / in-progress / done / deferred.

| Slice | Objective | Exact scope | Dependencies | Risk | Verification | Rollback | Status |
|---|---|---|---|---|---|---|---|
| S1 | Architecture knowledge base (this document set) | `docs/architecture/*` | none | none | n/a (docs) | revert commit | in-progress |
| S2 (P0) | Remove inference→agrivision private store edge | `inference/fieldContext.js` (new), `InferenceActionPanel.js`, agrivision registration point, boundary-test allowlist entry removal | S1 | R-1 low | arch test (edge gone), full Jest, tsc, export:web | revert commit | pending |
| S3 (P0/P4) | Contain `@core/store/useMapStore` as compatibility | boundary test COMPATIBILITY_ROOTS + docs | S1 | none (test+docs) | arch test | revert commit | pending |
| S4 (P3) | Station routes adopt public entry (L4B) | `app/(station)/station/*.js`, `(station)/_layout.web.js`, `station/index.js` (+SoilzeProShell export), boundary test (remove 11 entries, update export assertion) | S1 | R-2 | arch test, full Jest, tsc, export:web | revert commit | pending |
| S5 (P3) | Agrivision public entry + thin-route adoption (L5A) | `agrivision/index.js` (new), thin routes (`fields`, `my-fields`, `field-detail/*`, `cultivation`, `field-map`, `zone-detail`, `fieldsLegacy`, `_layout` shell/CameraModal), boundary test entry removal | S1 | R-2 | same matrix | revert commit | pending |
| S6 (P2) | Extract home route implementation | `app/(agrivision)/index.js` → `agrivision/screens/HomeScreen.jsx`; route becomes thin; allowlist cleanup | S5 | R-1 | same matrix | revert commit | pending |
| S7 (P2) | Extract diagnosis-result route | → `inference/screens/DiagnosisResultScreen.jsx` (+ inference public entry export) | S5 | R-1 | same matrix | revert commit | pending |
| S8 (P2) | Extract encyclopedia route | → `agrivision/screens/EncyclopediaScreen.jsx` | S5 | R-1 | same matrix | revert commit | pending |
| S9 (P2) | Extract chat route | → `agrivision/screens/ChatScreen.jsx` | S5 | R-1 | same matrix | revert commit | pending |
| S10 (P2) | Extract settings route | → `agrivision/screens/SettingsScreen.jsx` | S5 | R-1 | same matrix | revert commit | pending |
| S11 (P2) | Extract inference route composition | `inference.js` thin; InferenceLayout wiring via public entries | S2, S5 | R-1 | same matrix | revert commit | pending |
| S12 (P6) | Dead-code cleanup | delete `src/components/AdminPanel/**`, `src/config/api.js`, `src/constants/theme.js`, `Test.txt` | S1 evidence | R-7 | full Jest, tsc, export:web | revert commit | pending |
| S13 | Final docs sync + final review | `docs/architecture/*`, ledgers | all | none | final review pass | revert commit | pending |
| P1 | Field-store consolidation | deferred | runtime verification (R-3) | R-4 high | authenticated journeys | — | deferred |
| L6 | Legacy GridShell retirement | deferred | P0 runtime evidence + human gate | high | — | — | deferred |

Priorities P0 (S2, S3) → P3 boundary enforcement (S4, S5) → P2 route thinning (S6–S11) → P6
cleanup (S12). P1 and L6 are explicitly deferred with reasons in the risk register.
