# L1 Fresh Lab Baseline Audit

Status: complete for baseline characterization; this is not candidate evidence.

## Integrity

| Item | Evidence |
|---|---|
| Lab worktree | `E:\Documents\Khoa Luan 2026\cropvision_refactor_lab\CropVision` |
| Authorized parent | `E:\Documents\Khoa Luan 2026\cropvision_refactor_lab` |
| Branch | `refactor-lab/modulith-v1` |
| Frozen baseline and initial HEAD | `484c1cc6f476b970f5f047bee22482ae1063cb2b` |
| Baseline tag | `lab/baseline-484c1cc` -> frozen baseline |
| Origin fetch/push | `https://github.com/ldhv-04/CropVision.git` |
| Remote `main` at audit | `484c1cc6f476b970f5f047bee22482ae1063cb2b` (no divergence) |
| Upstream after authorized branch creation | none |
| LFS/submodules | no pointer files, attributes, declarations, or gitlinks found |

The worktree was clean before installation and after every baseline cleanup. `npm ci`
materialized only ignored `App/node_modules` from the committed lockfile.

## Product surfaces and route chains

### P0 Station Electron

Development host chain:

`App/package.json#electron` -> `electron electron/main.js` after port 8081 is ready ->
`App/electron/main.js` -> sandboxed `BrowserWindow` -> `App/electron/preload.js` ->
`window.electronAPI = { platform: "electron" }` -> Expo renderer at
`http://localhost:8081`.

Authenticated admin route chain:

`App/app/index.js` -> `/(station)` -> `App/app/(station)/index.js` -> `/station` ->
`App/app/(station)/station/index.js` ->
`App/src/modules/station/pages/DashboardPage.jsx`, wrapped by
`App/app/(station)/_layout.web.js` ->
`App/src/modules/station/layout/SoilzeProShell.jsx` -> `<Slot />`.

Station's nested `station/*.js` files are thin adapters but deep-import private pages.
The outer Station routes are redirect aliases. `StationShell` and `MapShell` are frozen,
unrouted compatibility code; the canonical Station shell is `SoilzeProShell`.

### P0 Agrivision React Native

Authenticated farmer route chain:

`App/app/index.js` -> `/(agrivision)` ->
`App/app/(agrivision)/_layout.js` -> native Expo Router tabs ->
`App/app/(agrivision)/index.js`.

The assigned-field/cultivation chain is:

`fields.js` -> `MobileFieldsScreen.jsx` ->
`field-detail/[fieldId].js` -> `MobileFieldDetailScreen.jsx` ->
`field-detail/[fieldId]/cultivation/[zoneId].js` ->
`MobileZoneCultivationScreen.jsx`.

The dynamic adapters are thin, but the Agrivision home, diagnosis, encyclopedia, chat,
settings, and layout route files still own UI, state, API calls, and orchestration.

### P2 browser preview

The browser shares the Expo web renderer with Electron but does not have the preload
bridge. A blank unauthenticated session is intended to follow `/` -> `/welcome`.
Admin browser sessions follow the Station web route, but browser results cannot certify
Electron. The current safe `auth.spec.ts` smoke did not reach a rendered document.

### P3 Agrivision wide web and compatibility

At width greater than 768, `App/app/(agrivision)/_layout.js` loads
`AgrivisionShell`, which delegates to `@core/components/GridShell`, which re-exports
`legacy/GridShell`. This is an existing compatibility edge, not a supported product path.
`App/app/(main)/_layout.js` is a second existing web GridShell consumer. Neither may grow.

## Ownership and dependency findings

- No direct Station-to-Agrivision, Agrivision-to-Station, `@core`-to-owner, or
  `platform`-to-owner imports were found by the baseline searches.
- No owner root public entry exists. Routes import owner pages/screens directly.
- `App/src/modules/@core/api/apiClient.js` uses a fixed-string `require()` of
  `../auth/useAuthStore`; the auth store statically imports the API client. This is the
  transport/auth cycle that L3 must remove.
- `apiClient.js` detects Electron using `Platform.OS`, `navigator.userAgent`, while
  `platform/hooks/usePlatformInfo.js` already uses the preload bridge. Runtime capability
  logic is duplicated and inconsistent.
- Agrivision has parallel field-state families under `store/` and `stores/` plus
  mobile-specific field and cultivation stores. Their readers/writers must be traced
  before consolidation.
- Agrivision route files contain at least twelve direct API invocations. The 854-line
  home route and 825-line diagnosis route are owner implementations living in the router.
- Three GridShell layers exist: owner widgets, `legacy/GridShell`, and
  `@core/components/GridShell` compatibility re-exports. Existing live consumers are
  fixed compatibility edges, not architectural precedent.
- `App/src/modules/@core/components/MapShell` and its children are frozen compatibility
  code reached only through the unrouted `StationShell` entry at this baseline.
- Generated `App/coverage/**` and `App/test-results/.last-run.json` are historically
  tracked. This program will not add or refresh generated evidence.

## Drift from the earlier `bf3bd68` audit baseline

The frozen lab is two commits ahead of `bf3bd68` and includes the large `959951e Update
new UI` migration. The App diff is 170 files, 17,647 insertions, and 4,294 deletions.
Material drift includes the SoilzePro Station route tree, Electron static-server/security
host, Agrivision mobile field/cultivation screens and stores, owner/legacy GridShell
splitting, and new inference diagnostics. Earlier route/import assumptions cannot be
reused without this audit.

## Discovered commands

| Purpose | Existing command |
|---|---|
| Deterministic install | `cd App && npm ci` |
| Jest | `cd App && npm test -- --runInBand` |
| TypeScript config check | `cd App && npx tsc --noEmit` |
| Electron static/security smoke | `cd App && node electron/smoke-check.js` |
| Web export | `cd App && npm run export:web` |
| P2 Playwright smoke | `cd App && npx playwright test e2e/auth.spec.ts --reporter=list` |
| Native launch/build | `cd App && npm run android` / committed `android/gradlew.bat` |
| Windows Electron package | `cd App && npm run build:win` (depends on web export) |

There are no frontend lint, format, architecture, route-ownership, or dedicated Electron
runtime scripts in `App/package.json` at this baseline.

## Baseline results

- `npm ci`: PASS; 1,031 packages installed. npm reported 19 audit findings and existing
  deprecation warnings. No audit fix was run.
- `npm test -- --runInBand`: PASS; one suite and one assertion. The assertion only proves
  that `ExpoRoot` can be required.
- `npx tsc --noEmit`: PASS.
- `node electron/smoke-check.js`: PASS; static syntax and policy only.
- `npm run export:web`: FAIL, pre-existing. `StationMapCanvasMapLibre.jsx` and
  `ZoneEditorPage.jsx` import undeclared `maplibre-gl`; neither package manifest nor lock
  contains it.
- safe P2 `auth.spec.ts`: FAIL 3/3; the HTTP server answered but the app did not render or
  redirect. This is consistent with the unresolved web bundle failure. Port 8081 was free
  before the run and had no listener afterward.
- `android/gradlew.bat assembleDebug`: environment failure after the unchanged ten-minute
  ceiling with no output. Three task-owned Java processes and all generated Android build
  trees were removed; the worktree returned clean.
- Actual Electron: not run because the existing launcher has no proven task-owned profile
  harness and the renderer cannot bundle.
- Actual native: not run. Android tooling and AVD `Pixel_8_Pro` exist, but no device was
  attached and the committed build did not complete.
- Authenticated P0 journeys: not run. A local PostgreSQL listener on 5432 is unowned/shared
  and forbidden. Docker is installed but its daemon is unavailable; the compose definition
  uses persistent named volumes and requires explicit runtime values. No environment file
  was read.

## L1 decision

L2 may proceed because the failures have safe frontend-only diagnoses or explicit
environment classifications and no product source/configuration changed. No later phase
may claim PASS until the missing dependency/build, isolated Electron profile, disposable
backend fixtures, actual Electron journey, and actual native journey are all green.
