# Verification Ledger

Status values: PASS, FAIL, BLOCKED, or NOT RUN. A static or mocked result never substitutes
for a mandatory P0 runtime row.

| Gate | Command/environment | Data source | Surface | Baseline result | Evidence |
|---|---|---|---|---|---|
| A deterministic install | `App: npm ci` | committed lock | whole frontend | PASS | 1,031 packages; 19 npm audit findings recorded |
| A all Jest tests | `App: npm test -- --runInBand` | test mocks only | static/unit | PASS | 1 suite, 1 test |
| A typecheck | `App: npx tsc --noEmit` | none | static | PASS | exit 0 |
| A lint | no script discovered | none | static | NOT RUN | project provides no command |
| A format | no script discovered | none | static | NOT RUN | project provides no command |
| A architecture focused | `npx jest __tests__/architectureBoundary.test.js --runInBand` | source graph | architecture | PASS | 7 rules, no snapshots |
| A architecture negative proof | temporary Station private import of Agrivision store | source graph | architecture | PASS | intended run failed on exact edge; file removed; suite green again |
| A web renderer build | `App: npm run export:web` | none | shared renderer | FAIL | undeclared `maplibre-gl` |
| A tracked artifact hygiene | status and exact cleanup | none | repository | PASS | worktree clean after tests |
| B Electron static/security | `App: node electron/smoke-check.js` | none | Electron static | PASS | syntax/policy assertions |
| B Electron dev process | no safe profile harness | blank task profile | Station Electron | BLOCKED | harness absent; renderer build fails |
| B preload bridge/no Node | static preload/main inspection only | none | Station Electron | NOT RUN | requires actual renderer proof |
| B blank unauthenticated document | not run | blank task profile | Station Electron | BLOCKED | same causes |
| B authenticated Station journey | not run | real disposable stack required | Station Electron | BLOCKED | no proven disposable stack |
| B renderer package | `npm run build:win` not reached | none | Station Electron | BLOCKED | web export fails first |
| B packaged smoke | not run | blank task profile | Station Electron | BLOCKED | package absent |
| B cleanup | port/process/artifact checks | none | Electron/P2 | PASS for attempted P2 run | port 8081 clear; generated files restored/removed |
| C Agrivision owner tests | no owner-specific baseline tests | mocks only | Agrivision native | NOT RUN | L2/L5 required |
| C native build | `android/gradlew.bat assembleDebug` | none | Android | FAIL | ten-minute environment timeout, no output |
| C native runtime | AVD available, not launched | blank task AVD required | Agrivision native | BLOCKED | build incomplete; no task-owned device session |
| C blank unauthenticated state | not run | blank task AVD | Agrivision native | BLOCKED | native runtime absent |
| C assigned-field/cultivation journey | not run | real disposable stack required | Agrivision native | BLOCKED | no proven disposable stack/runtime |
| C native error log check | not run | none | Agrivision native | BLOCKED | runtime absent |
| C cleanup | exact Java/build cleanup | none | Android build | PASS | task Java processes and generated trees removed |
| D P2 HTTP readiness/auth smoke | `npx playwright test e2e/auth.spec.ts --reporter=list` | blank browser context | browser preview | FAIL | 3/3; document did not render/redirect |
| D P3 containment/no growth | baseline import search | none | wide web/GridShell | PASS as static baseline | two live GridShell route/shell consumers recorded |

## Runtime isolation facts

- No remote ref was fetched or merged.
- No `.env` file or secret was read.
- Port 5432 has an existing listener and was not touched.
- Docker daemon was unavailable and no container/volume was started.
- Playwright's port 8081 was proven free before and after its run.
- The timed-out Gradle run created three Java processes; all were terminated by exact PID.
- All generated Playwright and Android output from the baseline attempts was removed or
  restored, leaving a clean worktree before documentation.

## L2 evidence

- Parser coverage: static import, re-export, fixed `require`, and fixed `import()` across
  JS/JSX/TS/TSX; comments ignored; dynamic expressions rejected.
- Fixed exception sets preserve only audited L1 edges and registry keys.
- The deliberate violation was never staged or committed.

## L3 evidence

| Check | Result | Evidence |
|---|---|---|
| Runtime bridge contract | PASS | browser vs Electron bridge plus Android unit assertions |
| Session-provider validation/injection | PASS | null/reset, invalid provider, and Authorization header assertions |
| Transport/auth cycle | PASS | architecture scan finds no API-to-auth import |
| Focused L3 tests | PASS | 2 suites, 9 tests |
| Whole Jest suite | PASS | 3 suites, 10 tests |
| TypeScript | PASS | `npx tsc --noEmit` |
| Electron static/security | PASS | `node electron/smoke-check.js` |

The pre-existing web export, P2, Android build, and real P0 runtime blockers remain
unchanged; L3 did not claim them as exercised behavior.

## L4A evidence

- Added exact runtime dependency `maplibre-gl@5.24.0`, matching the existing Station source
  imports and the official package/CSS installation contract.
- `npm run export:web`: PASS after the dependency repair; 84 static routes emitted.
- Station public API is a named, statically asserted root entry. No route uses it until L4B.
- npm audit remains the same baseline 19 findings; no audit fix or unrelated update ran.
