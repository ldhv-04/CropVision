# Decision and Exception Log

## D-001 - Authorized bootstrap branch transition

- Evidence: clean `main` tracked `origin/main` at frozen `484c1cc`; target branch absent.
- Decision: used the charter's one permitted `git switch --no-track -c` transition.
- Result: resolved; local refactor branch has no upstream and baseline tag is local only.

## D-002 - Shared database and unavailable Docker daemon

- Evidence: an unowned listener exists on port 5432; Docker daemon is unavailable; compose
  declares persistent volumes and fixed service container names.
- Invalid assumption: a disposable P0 backend was immediately runnable.
- Decision: do not touch the listener, read environment files, or start a stack until an
  isolated target, data lifecycle, ports, credentials, and cleanup are proven.
- Acceptance criteria: unchanged; real disposable P0 E2E remains mandatory.
- Affected tests: Station and Agrivision authenticated journeys.
- Rollback: none; no external state was changed.
- Status: environment blocker carried forward.

## D-003 - Source/lock inconsistency for MapLibre

- Evidence: two live Station sources import `maplibre-gl`; `npm ls` is empty and neither
  manifest nor lock declares it; web export fails at resolution.
- Invalid assumption: frozen baseline renderer could build after `npm ci`.
- Decision: record in L1 and defer the smallest justified frontend repair until after L2's
  safety contract. Do not hide it with a mock or weaken the build.
- Acceptance criteria: unchanged; Station renderer build and runtime remain mandatory.
- Affected paths: Station field/zone map and shared web renderer.
- Rollback boundary: future dedicated frontend dependency or implementation repair commit.
- Status: unresolved pre-existing frontend failure.

## D-004 - Android build timeout and cleanup

- Evidence: committed `assembleDebug` produced no output before the original ten-minute
  command ceiling; three Java processes began with the task and generated build trees.
- Decision: classify as environment-dependent, terminate only those PIDs, and remove only
  the generated Android trees. Do not inflate timeouts or claim a native build.
- Acceptance criteria: unchanged; native build/runtime must pass before final PASS.
- Status: unresolved environment failure; cleanup resolved.

## D-005 - P2 preview document failure

- Evidence: all three safe auth smoke tests received HTTP origin URLs but no rendered
  redirect or expected elements; web export already fails on module resolution.
- Decision: preserve the configured test and record the failure. Do not change retries,
  timeout, or selectors during L1.
- Acceptance criteria: unchanged; P2 readiness is supplementary and cannot certify P0.
- Status: unresolved pre-existing frontend failure.

## D-006 - Existing parser instead of a new architecture dependency

- Evidence: committed frontend tooling already installs Babel parser through the Babel
  toolchain and it parses the repository's JS/JSX/TS/TSX syntax.
- Decision: use that parser plus Node filesystem/path APIs in one Jest file. Do not add a
  package, helper generator, snapshot, or configuration file.
- Acceptance criteria: import/re-export/fixed-require/fixed-import coverage and negative
  proof remain mandatory.
- Rollback boundary: the L2 test/contract commit.
- Status: resolved; focused and whole-suite checks are green.

## D-007 - Minimal injected session provider

- Evidence: transport used a fixed-string `require()` of the auth store while the auth store
  imported transport; API host detection also duplicated platform capability logic.
- Decision: add one neutral session-provider module and one neutral runtime detector. Auth
  registers `useAuthStore.getState().token`; transport reads only the provider. Both API host
  resolution and `usePlatformInfo` use the same preload-bridge detector.
- Alternatives rejected: pass tokens through every existing call site (large behavioral
  migration), keep the lazy require (cycle remains), or create a larger service/container.
- Acceptance criteria: unchanged; Electron must be identified through the bridge and P0
  behavior still requires runtime proof.
- Affected files/tests: `@core/api`, `@core/auth`, `@core/session`, `platform/runtime`,
  platform hook, architecture test, and focused capability/session test.
- Rollback boundary: L3 commit only.
- Status: resolved statically and by unit tests; real P0 runtime remains pending.

## D-008 - Repair undeclared Station MapLibre runtime dependency

- Evidence: L1 web export failed because two live Station sources import `maplibre-gl` and
  its bundled CSS while the manifest/lock omitted the package.
- Original assumption invalidated: lockfile-faithful install alone could build the frozen
  renderer.
- Options considered: rewrite the 1,000-line map against another library, hide the route,
  or declare the package the source already uses. The exact declaration is the smallest
  behavior-preserving repair.
- Decision: add `maplibre-gl@5.24.0`, the current stable official npm release. No other
  package or version was changed intentionally.
- Acceptance criteria: unchanged; renderer build and real Electron checks remain required.
- Affected files/tests: App manifest/lock, Station renderer import resolution, web export.
- Rollback boundary: L4A Station public-boundary commit.
- Status: renderer export resolved; Electron/native runtime evidence still pending.
