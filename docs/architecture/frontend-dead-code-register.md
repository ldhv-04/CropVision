# Frontend Dead-Code Register

Verdicts: Active / Compatibility-only / Probably dead (static) / Confirmed dead (complete static
evidence) / Runtime verification required / Unsafe to remove.

| Candidate | Owner | Evidence | Verdict | Removal prerequisite | Rollback |
|---|---|---|---|---|---|
| `App/src/components/AdminPanel/{index.js,styles.js}` | unowned (pre-module tree) | zero importers across `app/`+`src/` (static, barrel, dynamic, require); not in route tree; no test/registry/electron reference; no side-effect import | Confirmed dead (complete static evidence) | full suite + web export green in removal slice | `git revert` of removal commit |
| `App/src/config/api.js` | unowned | zero importers (same sweep); superseded by `@core/api/apiClient` | Confirmed dead (complete static evidence) | same | same |
| `App/src/constants/theme.js` | unowned | zero importers; all `constants/theme` imports resolve to `@core/constants/theme` | Confirmed dead (complete static evidence) | same | same |
| `App/Test.txt` (repo root) | — | empty tracked file, no references | Probably dead | trivial; include in cleanup slice | same |
| `station/shell/StationShell.jsx` + Map* family | Station/compat | exported by `station/index.js` but no route/runtime consumer | Compatibility-only (frozen) | human decision gate; not removable by this program | — |
| `agrivision/screens/FieldsLegacyScreen.jsx` + `fieldsLegacy.js` route | Agrivision | routed; reachable via URL; superseded by MobileFieldsScreen | Runtime verification required (route removal = public workflow change) | navigation audit + human decision | — |
| `(main)` route group + `@core/components/AppShell` | compat | routed legacy URLs with redirect logic | Compatibility-only | legacy URL traffic evidence + human decision | — |
| `camera_placeholder.js` | Agrivision routes | referenced by Tabs custom button contract (`_layout.js` intercepts) | Active (structural) | — | — |
| `landing/index.web.jsx` vs `index.jsx` | landing | platform-specific resolution pair | Active | — | — |
| `App/coverage/**`, `App/test-results/` | tooling | historically tracked generated output | Unsafe to remove in this program (tracked baseline; separate decision) | human decision | — |

No deletion occurs outside a dedicated cleanup slice (roadmap P6).
