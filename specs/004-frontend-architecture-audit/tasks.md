# Tasks: Frontend Architecture Pruning, 12-Factor Consolidation & Inversion Testing

**Branch**: `004-frontend-architecture-audit` | **Date**: 2026-09-12 | **Plan**: [plan.md](plan.md)

---

## Tasks Breakdown

- [ ] **Task 1: Dọn dẹp Rác, Mã chết & Thư mục Bóng ma (Dead Code & Stubs)**
  - Mục tiêu: Xóa bỏ các tệp tin stub rỗng đã đánh dấu `// DEAD CODE`.
  - Thao tác:
    - Xóa `App/src/components/AdminPanel/index.js` và `App/src/components/AdminPanel/styles.js`.
    - Xóa `App/src/config/api.js`.
    - Xóa `App/src/constants/theme.js`.
    - Xóa các thư mục trống: `App/src/components/`, `App/src/config/`, `App/src/constants/`.
  - Nghiệm thu: Không còn tệp rác; không có lỗi thiếu module trong dự án.

- [x] **Task 2: Giải thể Chuỗi Re-export Shims 3 Tầng**
  - Mục tiêu: Cắt đứt chuỗi re-export trung gian `@core/components/GridShell` $\rightarrow$ `legacy/GridShell` $\rightarrow$ `station/widgets`.
  - Thao tác:
    - Xóa `App/src/modules/legacy/` (20 tệp).
    - Dọn dẹp `App/src/modules/@core/components/GridShell/widgets/` loại bỏ 11 re-export shims, chỉ giữ 4 canonical widgets.
    - Cập nhật các import trỏ trực tiếp về widget gốc tại `station` hoặc `agrivision`.
  - Nghiệm thu: Xóa toàn bộ tệp tin rác; ứng dụng biên dịch sạch sẽ không cảnh báo lỗi import. 3/3 test suites pass.

- [x] **Task 3: Sửa chữa Layer Inversion & Đóng gói Theme Nền tảng**
  - Mục tiêu: Đảm bảo `@core` hoàn toàn độc lập, không import ngược từ `agrivision`.
  - Thao tác:
    - Bổ sung định nghĩa `THEME_MODES` và `MOBILE_PALETTES` vào `App/src/modules/@core/constants/theme.js`.
    - Sửa `App/src/modules/@core/context/ThemeContext.jsx` trỏ về `../constants/theme`.
    - Cập nhật các tệp liên quan trong `agrivision` import từ `@core`.
  - Nghiệm thu: 0 layer inversion trong theme; ThemeContext hoạt động ổn định trên cả Web và Mobile.

- [x] **Task 4: Hợp nhất Canonical Field Store (12-Factor App Single Source of Truth)**
  - Mục tiêu: Triệt tiêu tình trạng 4 store cùng quản lý Cánh đồng; xóa thư mục `agrivision/stores/`.
  - Thao tác:
    - Xây dựng `App/src/modules/@core/store/useFieldStore.js` chuẩn hóa các thao tác CRUD và cache dữ liệu Cánh đồng.
    - Chuyển `fieldMapStore` và `metricStore` về `agrivision/store/useFieldMapStore.js` và `useMetricStore.js`.
    - Cập nhật các component (`CreateFieldWizard.jsx`, `useFieldMap.js`, `useFieldSelector.js`, v.v.) sử dụng canonical store.
    - Xóa thư mục trùng lặp `App/src/modules/agrivision/stores/`.
  - Nghiệm thu: Dữ liệu cánh đồng đồng bộ tức thì trên toàn bộ giao diện; chỉ còn 1 store duy nhất cho entity Field.

- [x] **Task 5: Chuẩn hóa & Dọn dẹp Định tuyến Expo Router**
  - Mục tiêu: Xóa bỏ xung đột route và các file redirect thừa thãi.
  - Thao tác:
    - Xóa 10 tệp redirect thừa tại `App/app/(station)/*.js` (`alerts.js`, `fields.js`, `index.js`, v.v.).
    - Chuẩn hóa route điều hướng trực tiếp vào `/station` và `/station/system`.
  - Nghiệm thu: Không còn cảnh báo route collision trong console của Expo Router.

- [x] **Task 6: Thiết kế & Triển khai Bộ Kiểm thử Nghịch đảo Inversion Testing**
  - Mục tiêu: Kiểm thử hệ thống trước các kịch bản bất lợi và tình huống cực đoan.
  - Thao tác:
    - Tạo `App/__tests__/inversionStress.test.js`:
      - Test 1: Đứt mạng đột ngột (network disconnect) khi đang fetch và sync.
      - Test 2: Bão gọi đồng thời (race condition / concurrency storm) trên Store.
      - Test 3: Khôi phục khi cache/AsyncStorage chứa dữ liệu dị tật (corrupted JSON).
      - Test 4: Phòng thủ chống dữ liệu không gian GeoJSON dị tật (rỗng, thiếu đỉnh, đảo cực).
  - Nghiệm thu: 100% tests (17/17 tests, 4/4 suites) trong `App/` PASS.

- [x] **Task 7: Kiểm chứng Toàn diện & Xác thực Zero-Regression**
  - Mục tiêu: Đảm bảo không có bất kỳ lỗi hồi quy nào sau khi dọn dẹp.
  - Thao tác:
    - Chạy toàn bộ App Jest suites: `npm test` trong `App/` (4/4 suites, 17/17 tests PASS).
    - Chạy Backend Jest suites: `npm test` trong `backend/` (7/7 suites, 57/57 tests PASS).
    - Chạy AI Core Pytest: `docker exec cropvision-ai-core pytest` (5/5 tests PASS).
  - Nghiệm thu: 100% test suites PASS trên cả 3 tầng (79/79 tests pass, 0 regressions).
