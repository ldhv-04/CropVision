# Frontend Compatibility Register

Every compatibility area, its consumers, and its retirement condition. Additions are forbidden;
the boundary suite pins consumers and registry keys.

| Compatibility area | Consumers | Active runtime | Frozen | Replacement | Retirement condition |
|---|---|---|---|---|---|
| `legacy/GridShell/**` (incl. compat registries) | `@core/components/GridShell` re-export | P3 wide web, legacy `(main)` web | Yes | SoilzePro (Station) / Tabs (Agrivision) | L6: zero routed consumers + registry keys proven unreferenced + P0 runtime evidence |
| `@core/components/GridShell` | `(main)/_layout.js`, `AgrivisionShell` | P3/legacy web | Yes | direct owner shells | Same as legacy GridShell |
| `agrivision/shell` (AgrivisionShell) | `(agrivision)/_layout.js` wide web | P3 wide web | Yes (adapter) | none planned | Retires with GridShell |
| `station/shell` (StationShell) | `station/index.js` public re-export only | none routed | Yes | SoilzeProShell | Removal requires human decision (frozen) once export consumers proven zero |
| `@core/components/MapShell`, `MapSidebar`, `MapDetailDrawer`, `TimelineScrubber` | StationShell only | none routed | Yes | SoilzePro pages | Same gate as StationShell |
| `@core/store/useMapStore` | frozen Map* components + legacy `MapWidget` | none routed (P3 widget path) | Effectively frozen (all consumers frozen) | Station GIS store family | Retires with MapShell family |
| owner `widgets/GridShell/*` (station + agrivision) | legacy GridShell widget wrappers | P3 wide web | Yes | — | Retires with GridShell |
| `(main)` route group | direct legacy URLs | legacy web | Yes (no growth) | `(station)`/`(agrivision)` groups | Legacy URL traffic confirmed zero + human decision (public route removal) |
| `@core/components/AppShell` | `(main)/_layout.js` mobile branch | legacy mobile | No (neutral UI) | Tabs layout | Retires with `(main)` group |
| `fieldsLegacy.js` → `FieldsLegacyScreen` | routed | P0 mobile (routed) | No | `fields.js` → MobileFieldsScreen | Confirm no navigation targets `/fieldsLegacy`, then dedicated removal slice (route removal = human gate) |

Rules: compatibility code gains no new consumers (boundary suite rule 5), no new registry keys
(rule 6), and no new responsibilities. `@deprecated` markers may be added only per the dead-code
policy.
