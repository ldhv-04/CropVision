# Frontend Modulith — Target State

Extends `docs/ops/lab-refactor/01-target-architecture-contract.md` (still authoritative for deny
rules and allowlists). This file maps the target onto the existing tree — no generic re-layout.

## Target layout (existing paths preserved)

```text
App/
├── app/                      # thin composition only: params, redirects, screen selection, providers
├── src/modules/
│   ├── station/              # public entry: index.js (screens + SoilzeProShell)
│   ├── agrivision/           # public entry: index.js (screens + shell adapter)
│   ├── inference/            # field context via provider contract, no owner imports
│   ├── admin/, history/, landing/   # small modules; admin/history feed compat + station alerts
│   ├── @core/
│   │   ├── api/, auth/, session/    # platform: transport, session, auth authority
│   │   ├── constants/, context/     # shared neutral
│   │   └── components/…             # frozen compatibility (GridShell, Map* family) — no growth
│   ├── platform/             # runtime detection, native service adapters
│   └── legacy/GridShell/     # frozen compatibility
└── electron/                 # desktop host
```

Deliberate deviations from the generic modulith template (justified — migration cost with zero
architectural gain): no `src/compatibility/` root (compat lives where its frozen consumers are,
pinned by test); no per-module `public/` folder (a single `index.js` is the public API); `@core`
keeps the platform+shared split at folder level instead of separate top-level roots.

## Rules in force at completion

- A1 ownership: every file classified in `frontend-module-boundaries.md`.
- A2 narrow APIs: routes import only `station/index.js`, `agrivision/index.js`, audited neutral
  targets, or exact frozen edges.
- A3 direction: composition → owners → platform/shared; zero reverse edges (test rule 2).
- A4 thin routes: no route file owns feature UI or API orchestration (route-module allowlist
  shrinks to zero or documented residue).
- A5 authorities: `frontend-state-authorities.md` table; one store per API family.
- A6 purity: `@core` admin-domain state (useMapStore) contained as compatibility.
- A7 legacy: compatibility consumer allowlist frozen at two edges; registries pinned.
- A8–A10: boundary suite + Jest suites remain the executable contract.
