# Target Architecture Contract

Status: executable from L2 onward.

## Product authority

- Station Electron is P0 desktop.
- Agrivision React Native is P0 mobile.
- Browser web is P2 preview only.
- Agrivision wide web is P3 unsupported compatibility only.
- `Platform.OS === "web"` is never sufficient proof of Electron.
- GridShell, MapShell, StationShell, and legacy adapters are frozen/no-growth zones.

## Source roots and public entries

| Root | Responsibility | May import |
|---|---|---|
| `App/app/**` | Expo Router address and minimal composition | owner root public entry or audited neutral composition dependency |
| `App/src/modules/station/**` | Station screens, state, services, entities, owner UI | Station internals, neutral core/platform/shared |
| `App/src/modules/agrivision/**` | Agrivision native screens, state, services, entities, owner UI | Agrivision internals, neutral core/platform/shared |
| `App/src/modules/@core/**` | transport, session contracts, technical services, neutral UI primitives | neutral code only |
| `App/src/modules/platform/**` | runtime/platform capability | neutral code only |
| `App/src/modules/shared/**` | proven domain-neutral multi-owner code only | neutral code only |

The owner public entries are exactly:

- `App/src/modules/station/index.js`
- `App/src/modules/agrivision/index.js`

External consumers may import the owner directory/index only. Any screen, store, service,
component, page, shell, widget, or utility below the owner root is private.

## Deny rules

The executable rules in `App/__tests__/architectureBoundary.test.js` reject:

1. Station importing Agrivision internals.
2. Agrivision importing Station internals.
3. `@core`, `platform`, or `shared` importing either owner.
4. external owner-private imports unless the exact L2 baseline edge is allowlisted.
5. any new route-to-module responsibility outside an owner public entry, an audited
   neutral dependency, or an exact L2 baseline edge.
6. any new consumer of a compatibility root.
7. any new compatibility content key, menu route, widget key, layout variant, or legacy
   route pattern.
8. any new transport-to-auth-store edge.
9. dynamic `require()` or `import()` expressions that cannot be resolved statically.
10. source that the selected parser cannot parse.

## Parser contract

The test uses the already-installed Babel parser and recursively scans JS, JSX, TS, and TSX
under `App/app` and `App/src/modules`. It covers:

- `import` declarations, including side-effect imports;
- `export ... from` and `export * from`;
- fixed-string `require()`;
- fixed-string `import()`.

Comments are ignored by the parser. Non-string/dynamic `require()` and `import()` calls are
violations, not silently skipped. Unsupported syntax fails parsing and therefore fails the
suite. External package imports are outside owner-path resolution but remain syntax-checked.

## Fixed L2 exceptions

The exact authoritative exception strings live in named `Set` constants in the architecture
test so additions are visible in code review and failures report the missing edge.

- `OWNER_PRIVATE_ALLOWLIST`: 37 baseline migration edges from routes, inference, and legacy
  wrappers into owner internals. Entries may only be removed as public entries replace them.
- `ROUTE_MODULE_ALLOWLIST`: 15 baseline feature/API route edges. Entries may only be removed
  as implementations leave `App/app`.
- `COMPATIBILITY_CONSUMER_ALLOWLIST`: exactly two live P2/P3 edges:
  - `app/(agrivision)/_layout.js -> ../../src/modules/agrivision/shell`
  - `app/(main)/_layout.js -> ../../src/modules/@core/components/GridShell`
- Transport/auth exceptions: none after L3. Transport imports only the neutral session
  provider; the auth store registers its token getter from the dependency-owning side.

Neutral route imports currently include `@core` outside its API folder and the landing
module root. This permits existing auth/layout composition, not owner business logic.

## Frozen compatibility registry

The L2 semantic baseline is exact:

- content: `admin`, `alerts`, `fields`, `history`, `system`;
- menu routes: `agrivisionHome`, `agrivisionInference`, `legacyAlerts`, `legacyFields`,
  `legacyHistory`, `legacySystem`;
- widgets: `AlertsFeed`, `Canvas`, `Chat`, `Content`, `Control`, `EpidemicLedger`, `Map`,
  `Menu`, `Nav`, `OverviewStats`, `Results`, `ScanTrend`, `SensorGrid`, `Stats`, `User`;
- layouts: `admin`, `dashboard`, `inference`;
- route patterns: `/(agrivision)/inference`, `/(station)`, `/alerts`, `/fields`, `/history`,
  `/inference`, `/system`.

Changing a registry requires explicit removal evidence. No addition is permitted by this
program.

## Removal gates

- L3 removed the sole transport/auth exception after injected session composition passed.
- L4 removes Station route/private exceptions as Station routes use `station/index.js`.
- L5 removes Agrivision route/private exceptions as Agrivision routes use
  `agrivision/index.js`.
- L6 removes legacy wrapper exceptions only after import, route, registry, and P0 evidence
  prove zero live responsibility.
- No allowlist may be broadened merely to make a test pass.

## Verification

Focused gate:

`cd App && npx jest __tests__/architectureBoundary.test.js --runInBand`

Whole Jest gate:

`cd App && npm test -- --runInBand`

L2 negative proof used a temporary Station file importing Agrivision private state. The
suite rejected the exact edge in both cross-owner and public-boundary tests. The file was
then deleted and the suite returned green.
