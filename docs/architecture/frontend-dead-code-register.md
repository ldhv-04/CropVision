# Frontend Dead-Code Register

Verdicts: Active / Compatibility-only / Probably dead (static) / Confirmed dead (complete static
evidence) / Runtime verification required / Unsafe to remove.

| Candidate | Owner | Evidence | Verdict | Removal prerequisite | Rollback |
|---|---|---|---|---|---|
| `App/src/components/AdminPanel/{index.js,styles.js}` | unowned (pre-module tree) | zero importers (static, barrel, dynamic, require, registry, electron, test); only residue is a historical comment in `useAdminStore.js:5` | Removed in S12 cleanup slice | met (full suite + export green) | `git revert` of S12 commit |
| `App/src/config/api.js` | unowned | zero importers; superseded by `@core/api/apiClient` | Removed in S12 | met | same |
| `App/src/constants/theme.js` | unowned | zero line-level importers; all `constants/theme` imports resolve to `@core/constants/theme` | Removed in S12 | met | same |
| `App/Test.txt` (repo root) | — | empty tracked file, no references | Removed in S12 | met | same |
| `station/shell/StationShell.jsx` + Map* family | Station/compat | exported by `station/index.js` but no route/runtime consumer | Compatibility-only (frozen) | human decision gate; not removable by this program | — |
| `agrivision/screens/FieldsLegacyScreen.jsx` + `fieldsLegacy.js` route | Agrivision | routed; reachable via URL; superseded by MobileFieldsScreen | Runtime verification required (route removal = public workflow change) | navigation audit + human decision | — |
| `(main)` route group + `@core/components/AppShell` | compat | routed legacy URLs with redirect logic | Compatibility-only | legacy URL traffic evidence + human decision | — |
| `camera_placeholder.js` | Agrivision routes | referenced by Tabs custom button contract (`_layout.js` intercepts) | Active (structural) | — | — |
| `landing/index.web.jsx` vs `index.jsx` | landing | platform-specific resolution pair | Active | — | — |
| `App/coverage/**`, `App/test-results/` | tooling | historically tracked generated output | Unsafe to remove in this program (tracked baseline; separate decision) | human decision | — |

No deletion occurs outside a dedicated cleanup slice (roadmap P6).
