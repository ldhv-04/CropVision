# Frontend Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| R-1 | Route-to-screen extraction changes navigation/params behavior | Medium | High (P0 mobile) | Extract one route per slice; preserve params/redirect/loading/error states; full Jest + export:web per slice | Open, mitigated per slice |
| R-2 | Public-entry migration breaks platform-specific resolution (`.native.jsx`, `.web.js`) | Medium | High | Re-export style preserved; `FieldsPage.native` covered by dedicated test; export:web after each slice | Open |
| R-3 | No authenticated runtime verification available (Electron, Android, disposable DB) | Confirmed | High | Documented environment blocker (D-002/D-004); no PASS claim on runtime rows; consolidation slices deferred | Carried forward |
| R-4 | Store consolidation across API families changes fetched data | High if attempted | High | Deferred; projection contract documented instead (state authorities doc) | Deferred by design |
| R-5 | Frozen-zone edits required to fix boundary violations | Low | Medium | Containment via test roots + allowlists instead of edits; human gate if unavoidable | Contained |
| R-6 | Allowlist edits could silently broaden exceptions | Low | Medium | Slices only remove entries; review diff of test file each commit | Controlled |
| R-7 | Dead-code deletion removes dynamically-referenced file | Low | Medium | Register evidence sweep (dynamic/require/registry/electron) before dedicated cleanup slice | Open |
| R-8 | Post-L4A drift commits (deps repin, backend SQL) interact with frontend slices | Low | Low | Baseline re-verified green at `486071f` before any slice | Closed |
