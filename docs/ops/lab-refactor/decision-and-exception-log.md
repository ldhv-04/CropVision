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
