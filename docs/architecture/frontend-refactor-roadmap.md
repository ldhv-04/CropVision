# Frontend Refactor Roadmap

Slices execute one at a time; each ends in a focused commit with tests green. Status values:
pending / in-progress / done / deferred.

| Slice | Objective | Exact scope | Dependencies | Risk | Verification | Rollback | Status |
|---|---|---|---|---|---|---|---|
| S1 | Architecture knowledge base (this document set) | `docs/architecture/*` | none | none | n/a (docs) | `git revert 17a7486` | done (`17a7486`) |
| S2 (P0) | Remove inference→agrivision private store edge | field context as prop through route → InferenceLayout → InferenceActionPanel (no new module file needed); allowlist entry removed | S1 | R-1 low | arch test, full Jest, tsc, export:web — all PASS | `git revert acb13d6` | done (`acb13d6`) |
| S3 (P0/P4) | Contain `@core/store/useMapStore` as compatibility | boundary test COMPATIBILITY_ROOTS + register | S1 | none | arch test PASS, zero new allowlist entries | `git revert a704a1b` | done (`a704a1b`) |
| S4 (P3) | Station routes adopt public entry (L4B) | 10 station routes + web layout via `station/index.js` (StationShell alias = SoilzeProShell, no export change needed); 11 allowlist edges removed | S1 | R-2 | full matrix PASS | `git revert 12284b7` | done (`12284b7`) |
| S5 (P3) | Agrivision public entry + thin-route adoption (L5A) | `agrivision/index.js` created; 9 routes swapped; 12 allowlist edges removed; public-surface assertion added | S1 | R-2 | full matrix PASS | `git revert f732e3c` | done (`f732e3c`) |
| S6 (P2) | Extract home route implementation | → `agrivision/screens/HomeScreen.jsx`; 2 allowlist edges removed | S5 | R-1 | full matrix PASS | `git revert 8747a10` | done (`8747a10`) |
| S7+S11 (P2) | Extract diagnosis-result + inference public entry | → `inference/screens/DiagnosisResultScreen.jsx`; `inference/index.js` created; inference route thinned; 6 allowlist edges removed; inference surface pinned | S5 | R-1 | full matrix PASS | `git revert 5c68ddd` | done (`5c68ddd`) |
| S8–S10 (P2) | Extract encyclopedia, chat, settings routes | → `agrivision/screens/{Encyclopedia,Chat,Settings}Screen.jsx`; 4 allowlist edges removed | S5 | R-1 | full matrix PASS | `git revert 14acdf3` | done (`14acdf3`) |
| S12 (P6) | Dead-code cleanup | deleted `src/components/AdminPanel/**`, `src/config/api.js`, `src/constants/theme.js`, `Test.txt` | S1 evidence | R-7 | full Jest, tsc, export:web PASS | revert S12 commit | done |
| S13 | Final docs sync + final review | `docs/architecture/*`, ledgers | all | none | final review pass | revert commit | done |
| P1 | Field-store consolidation | deferred | runtime verification (R-3) | R-4 high | authenticated journeys | — | deferred |
| L6 | Legacy GridShell retirement | deferred | P0 runtime evidence + human gate | high | — | — | deferred |

Priorities P0 (S2, S3) → P3 boundary enforcement (S4, S5) → P2 route thinning (S6–S11) → P6
cleanup (S12). P1 and L6 are explicitly deferred with reasons in the risk register.
