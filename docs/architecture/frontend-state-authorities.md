# Frontend State Authorities

One row per domain concept. "Verdict" states whether a single authority exists or an explicit
projection contract is required.

| Concept | Canonical owner | Other representations | Writers | Readers | Sync contract | Verdict |
|---|---|---|---|---|---|---|
| Authentication session | `@core/auth/useAuthStore` | none | auth screens, rehydrate | all gated layouts, transport via injected provider | token getter registered into `@core/session/sessionProvider` | Single authority |
| API origin | `@core/api/apiClient.API_ORIGIN` | none | build-time env + platform detector | transport, inference debug | — | Single authority |
| Runtime platform | `platform/runtime` (preload-bridge detector) | none | — | apiClient, usePlatformInfo | — | Single authority |
| Farmer field collection (owned fields + weather) | agrivision `store/useFieldStore` | — | home route, wizard | home route, FieldsLegacyScreen, inference field context | none | Authority for the "owned fields" API family (`ENDPOINTS.fields.*`) |
| Assigned fields + published zone maps | agrivision `store/useMobileFieldStore` | — | MobileFieldsScreen | MobileFields/MobileFieldDetail screens | none | Authority for the `ENDPOINTS.mobile.*` API family |
| Field CRUD + zones + activities (map editor family) | agrivision `stores/fieldStore` | fields array overlaps `useFieldStore.fields` | FieldMap wizard/hooks | FieldMap family, ZoneDetail | none | Duplicate collection with `useFieldStore` — projection contract required before consolidation (P1) |
| Field map UI state | agrivision `stores/fieldMapStore` | — | map hooks | map components | UI-local; explicit | Single authority (UI scope) |
| Zone metrics | agrivision `stores/metricStore` | — | map hooks | map + zone detail | — | Single authority |
| Sub-zones (home) | agrivision `store/useSubZoneStore` | `stores/fieldStore.currentZones` overlaps conceptually | home route | home route, legacy widgets | none | Duplicate concept across API families — same P1 item |
| Cultivation state | agrivision `store/useMobileCultivationStore` | — | MobileZoneCultivationScreen | same | — | Single authority |
| Inference context/results | inference `store/useInferenceStore` | — | inference screens/panels | inference module | field context via P0-1 provider contract | Single authority |
| Selected field (inference context) | agrivision `store/useFieldStore.selectedFieldId` | `useMobileFieldStore.selectedFieldId` (detail navigation) | respective screens | inference provider; detail screens | UI-local per family; explicit | Acceptable split: route-local selection vs inference context, now documented |
| Station GIS fields/zones | station `stores/fieldGISStore` | — | Station pages/hooks | Station pages | — | Single authority |
| Admin map scans (frozen) | `@core/store/useMapStore` | — | frozen Map* components | frozen Map* + legacy MapWidget | — | Compatibility-only; contained, no new consumers |
| Weather | `useFieldStore.weatherByField` | — | home route | WeatherWidget via home | — | Single authority |

## P1 consolidation preconditions

`useFieldStore` (owned fields), `stores/fieldStore` (editor family), and `useMobileFieldStore`
(assigned/published family) sit on three different backend API families with different response
shapes and different consumer journeys. Merging them is not a rename; it changes which API a
consumer hits. Consolidation therefore requires authenticated runtime verification of the mobile
journeys, which this environment cannot provide (see risk register R-3). Until then the contract
is: one store per API family, no cross-family writes, documented here.
