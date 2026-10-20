# Quickstart Validation Guide: Frontend World-Class Architecture

**Feature**: `005-frontend-architecture-benchmark`  
**Phase**: Phase 1 (Validation & Quickstart Guide)  
**Date**: 2026-09-12  

---

## 1. Prerequisites & Environment Setup

- Node.js $\ge 20.0.0$
- npm $\ge 10.0.0$
- Working directory: `/home/terminator/Project/active/CropVision/App`

```bash
cd App
npm install
```

---

## 2. Test Execution & Coverage Verification

Run all multi-tier frontend test suites to verify that tests pass and coverage metrics meet the governance threshold:

```bash
# Run unit & stress tests
npm test

# Run full coverage gate
npm run test:coverage
```

### Expected Outcomes:
- All test suites pass (100% green).
- Targeted modules (`@core/store`, `@core/offline`, `contracts/`) achieve $\ge 90\%$ test coverage.

---

## 3. Architecture & File Size Compliance Audit

Verify that no source files exceed the 300 LOC limit (Rule 2.1):

```bash
# Check if any files in App/src exceed 300 lines
find src/ -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | awk '$1 > 300 {print $1, $2}'
```

### Expected Outcomes:
- Zero files returned by the awk script once refactoring tasks are executed.

---

## 4. End-to-End GIS Rendering Verification

Launch the Station Web application to verify 60 FPS MapLibre GL rendering:

```bash
npm run web
```

- Open `http://localhost:8081/(station)`
- Verify that field polygons render smoothly via WebGL without dropped frames during panning and zooming.
