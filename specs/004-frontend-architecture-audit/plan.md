# Implementation Plan: Frontend Architecture Pruning, 12-Factor Consolidation & Inversion Testing

**Branch**: `004-frontend-architecture-audit` | **Date**: 2026-09-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-frontend-architecture-audit/spec.md` with explicit user lock-in.

---

## 1. Summary & Core Objectives

Triển khai kế hoạch tái cấu trúc phẫu thuật (Surgical Refactor) cho toàn bộ tầng Frontend (`App/`) theo 4 mục tiêu đã được người dùng phê duyệt:
1. **Xóa bỏ hoàn toàn Dead Code & Re-export Shims**:
   - Xóa `src/components/AdminPanel/`, `src/config/api.js`, `src/constants/theme.js`.
   - Xóa `src/modules/legacy/` và `src/modules/@core/components/GridShell/`.
   - Xóa 10 tệp redirect đệm thừa tại `app/(station)/*.js`.
2. **Khắc phục Đảo ngược Phân tầng (Layer Inversion)**:
   - Chuyển `THEME_MODES` và `MOBILE_PALETTES` vào `@core/constants/theme.js`. Đảm bảo `@core` không bao giờ import từ `agrivision` hay `station`.
3. **Hợp nhất Store Thực thể Fields (12-Factor App Single Source of Truth)**:
   - Xóa thư mục trùng lặp `agrivision/stores/`.
   - Tạo Canonical Field Store duy nhất tại `@core/store/useFieldStore.js`.
   - Tách bạch ranh giới giữa Domain Entity cache và View Map GIS state (`fieldGISStore.js`).
4. **Thiết kế lại Bộ Kiểm thử Nghịch đảo (Inversion Thinking Test Suite)**:
   - Viết bộ test `App/__tests__/inversionStress.test.js` kiểm tra độ bền vững trước bão lỗi: mạng rớt giữa chừng, race conditions, corrupted cache, và malformed GeoJSON.

---

## 2. Technical Context & Constraints

- **Công nghệ cốt lõi**: React Native 0.83.6, Expo Router 55, Zustand 5.0.12, Jest 29.
- **Tiêu chuẩn chất lượng**:
  - **Rule 2.1 (Modular File Sizing & SRP)**: Các module mới tạo và component tách nhỏ đều $\le 150-200$ dòng.
  - **Rule 2.6 (Explicit Approval Invariant)**: Đã được người dùng phê duyệt khóa ý tưởng.
  - **Rule 2.7 (Trade-Off Analysis)**: Đã hoàn tất đánh giá 5 chiều.
  - **Rule 2.11 (12-Factor App)**: Đảm bảo Single Source of Truth, Statelessness, Explicit Contracts.
  - **Rule 2.13 (Minimal Change Principle)**: Refactor phẫu thuật, không đổi URL routes bên ngoài, bảo toàn 100% logic UI.
  - **Test Passing Rate Target**: $\ge 90\%$ (mục tiêu 100% across all suites).

---

## 3. Component Breakdown & Target File Changes

### Component 1: Dọn dẹp Rác, Mã chết & Shims Trung gian (FR-001 & FR-002)
- `[DELETE]` `App/src/components/AdminPanel/index.js`
- `[DELETE]` `App/src/components/AdminPanel/styles.js`
- `[DELETE]` `App/src/config/api.js`
- `[DELETE]` `App/src/constants/theme.js`
- `[DELETE]` `App/src/modules/legacy/` (toàn bộ 20 tệp GridShell di sản)
- `[DELETE]` `App/src/modules/@core/components/GridShell/` (toàn bộ 20 tệp re-export shims)
- `[MODIFY]` Các file trước đây import qua shim (`app/(main)/_layout.js`, `AgrivisionShell.jsx`) trỏ trực tiếp về component gốc.

### Component 2: Sửa chữa Layer Inversion & Chuẩn hóa Theme (FR-003)
- `[MODIFY]` `App/src/modules/@core/constants/theme.js`: Tích hợp `THEME_MODES`, `MOBILE_PALETTES` từ `agrivision/constants/mobileTheme.js`.
- `[MODIFY]` `App/src/modules/@core/context/ThemeContext.jsx`: Import trực tiếp từ `../constants/theme.js` thay vì import ngược từ `../../agrivision/constants/mobileTheme`.

### Component 3: Hợp nhất Canonical Field Store (12-Factor App - FR-004)
- `[DELETE]` `App/src/modules/agrivision/stores/` (xóa thư mục trùng lặp `fieldStore.js`, `fieldMapStore.js`, `metricStore.js`).
- `[NEW]` `App/src/modules/@core/store/useFieldStore.js`: Store duy nhất quản lý CRUD Cánh đồng (Single Source of Truth), hỗ trợ cả `apiRequest` và auto-sync.
- `[MODIFY]` `App/app/(agrivision)/inference.js`: Import `useFieldStore` từ `@core/store/useFieldStore`.
- `[MODIFY]` `App/src/modules/agrivision/components/wizard/CreateFieldWizard.jsx`: Chuyển sang dùng canonical `useFieldStore`.

### Component 4: Tinh giản Routing Expo Router (FR-006)
- `[DELETE]` 10 tệp redirect thừa tại `App/app/(station)/*.js` (`alerts.js`, `fields.js`, `index.js`, `interventions.js`, `microbiome.js`, `recommendations.js`, `reports.js`, `sensors.js`, `settings.js`, `system.js`).
- Chuyển `App/app/(station)/index.js` trỏ trực tiếp đến Dashboard chính.

### Component 5: Bộ Kiểm thử Nghịch đảo Inversion Thinking (FR-008)
- `[NEW]` `App/__tests__/inversionStress.test.js`:
  - **Scenario A (Adversarial Network Drop)**: Gián đoạn mạng giữa chừng khi fetch hoặc sync pending queue, kiểm tra state recovery.
  - **Scenario B (Concurrent Store Race Condition)**: Bão gọi song song nhiều tác vụ thêm/xóa/sửa trên cùng một Field Store.
  - **Scenario C (Corrupted Cache Handling)**: AsyncStorage chứa JSON dị tật hoặc schema cũ, hệ thống tự reset về default thay vì crash app.
  - **Scenario D (Malformed Spatial Polygons)**: Tọa độ GeoJSON bị thiếu đỉnh, đảo vĩ/kinh độ, hoặc rỗng.

---

## 4. Verification Plan

### Automated Tests
1. **App Jest Test Suites**:
   - `npm test` trong `App/`: Chạy tất cả test suites (`agrivisionThemeAndPolygon.test.js`, `offlineSyncManager.test.js`, `routing.test.js`, và bộ mới `inversionStress.test.js`).
   - Yêu cầu: 100% tests PASS.
2. **Backend Jest Test Suites**:
   - `npm test` trong `backend/`: 7/7 suites PASS (57/57 tests).
3. **AI Core Pytest**:
   - `docker exec -e PYTHONPATH=/app cropvision-ai-core pytest`: 5/5 tests PASS.

### Manual / Structural Verification
- Kiểm tra `git status -s`: Xác nhận toàn bộ thư mục stub và dead files đã được xóa hoàn toàn.
- Kiểm tra cảnh báo Metro/Expo: Không còn bất kỳ cảnh báo trùng lặp route hay thiếu tệp import nào.
