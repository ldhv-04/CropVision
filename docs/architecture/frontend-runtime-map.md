# Frontend Runtime Map

Full entry→store chains live in `frontend-modulith-current-state.md`. This file is the surface
matrix and authority list.

## Surfaces

| Surface | Priority | Entry | Shell | Status |
|---|---|---|---|---|
| Station Electron | P0 | `electron/launch.js` → `main.js` → preload bridge → Expo web renderer | `SoilzeProShell + <Slot />` | Supported |
| Station browser web | P2 | Expo web, `/(station)` | `SoilzeProShell` | Preview only; cannot certify Electron |
| Agrivision native (Android/iOS) | P0 | Expo native, `/(agrivision)` tabs | `(agrivision)/_layout.js` Tabs | Supported |
| Agrivision narrow web | P2 | Expo web ≤768px | Tabs layout | Preview |
| Agrivision wide web | P3 | Expo web >768px | `AgrivisionShell` → legacy GridShell | Frozen compatibility, no growth |
| Legacy `(main)` group | compat | `/dashboard`, `/alerts`, `/history`, `/admin`, `/analysis` | redirects + GridShell/AppShell | Frozen compatibility |

## Single documented authorities (A9)

| Concern | Authority |
|---|---|
| Runtime entry | `App/app/_layout.js` (Expo Router root) + `App/electron/launch.js` (desktop host) |
| Route ownership | `App/app/**` file-system routes only |
| Shell composition | Station: `(station)/_layout.web.js` → SoilzeProShell; Agrivision: `(agrivision)/_layout.js` |
| Authentication | `@core/auth/useAuthStore` (+ session provider seam for transport) |
| API configuration | `@core/api/apiClient.API_ORIGIN` |
| Platform detection | `platform/runtime` preload-bridge detector |
| Domain state | per-concept table in `frontend-state-authorities.md` |
