# Feature Specification: Frontend Architecture Deep-Dive & Clean Code Audit

**Feature Directory**: `specs/004-frontend-architecture-audit`  
**Created**: 2026-09-12  
**Status**: Draft / Brainstorming  
**Author**: Antigravity Assistant

---

## 1. Executive Problem Framing

Hệ thống frontend của CropVision (`App/`) đã trải qua nhiều giai đoạn chuyển dịch kiến trúc: từ mô hình đơn khối (Monolithic Dashboard) sang mô hình Đa ứng dụng phân quyền (AgriVision dành cho Nông dân và Station Command dành cho Kỹ sư trạm). 

Tuy nhiên, việc chuyển dịch chưa dứt điểm đã để lại nhiều "vết tích kiến trúc" (architectural sediment) nghiêm trọng:
1. **Mã rác & Mã di sản (Dead Code & Legacy Shims)**:
   - Các tệp tin rỗng được đánh dấu `// DEAD CODE` vẫn tồn tại (`src/components/AdminPanel/`, `src/config/api.js`).
   - Chuỗi re-export 3 tầng (Triple-hop shim chain): `@core/components/GridShell` $\rightarrow$ `legacy/GridShell` $\rightarrow$ `station/widgets/GridShell` và `agrivision/widgets/GridShell`.
   - Toàn bộ nhóm route `app/(main)/` chỉ đóng vai trò redirect shim, gây cảnh báo trùng lặp route với `(station)` và `(agrivision)`.
   - 10 tệp redirect thừa trực tiếp dưới `app/(station)/*.js` chuyển hướng vào `app/(station)/station/*.js`.
2. **Đảo ngược phân tầng (Layer Inversion Violation)**:
   - Thư mục nền tảng `@core/context/ThemeContext.jsx` lại import ngược hằng số giao diện từ module tính năng cấp cao `agrivision/constants/mobileTheme.js`.
3. **Phân mảnh State Management & Nhân bản Thực thể**:
   - Tồn tại đồng thời 4 store cùng quản lý thực thể `fields`: `agrivision/store/useFieldStore.js`, `agrivision/stores/fieldStore.js`, `agrivision/store/useMobileFieldStore.js`, và `station/stores/fieldGISStore.js`.
   - Sử dụng lẫn lộn 2 quy ước thư mục: `store/` (số ít) và `stores/` (số nhiều).
4. **Vi phạm Quy chuẩn Tệp tin Lớn (Rule 2.1)**:
   - Có đến **25 tệp vượt ngưỡng 300 dòng**, trong đó 4 tệp tiệm cận hoặc vượt 1,000 dòng (`StationMapCanvasMapLibre.web.jsx` 1,084 dòng, `ZoneEditorPage.web.jsx` 988 dòng, `MobileZoneCultivationScreen.jsx` 912 dòng, `diagnosis-result.js` 825 dòng).
5. **Xung đột Thư viện Bản đồ (Triple Map Stack Bloat)**:
   - Frontend đang gánh đồng thời 3 thư viện bản đồ không tương thích: `react-leaflet` (DOM Web), `maplibre-gl` (WebGL Vector), và `react-native-maps` (Native Mobile), gây phình to bundle size (~15MB dependencies).

---

## 2. User Stories & Value Proposition

### User Story 1: Giảm tải Nhận thức cho Kỹ sư Phát triển (Developer Experience & Maintainability)
- **Là một** kỹ sư frontend hoặc thành viên mới tham gia dự án,
- **Tôi muốn** cấu trúc thư mục rõ ràng, phân tầng một chiều, không có file thừa hoặc shim trung gian 3 cấp,
- **Để** tôi có thể định vị chính xác component cần sửa chữa mà không sợ sửa nhầm file stub hay làm vỡ liên kết ngầm.

### User Story 2: Hiệu năng Tải trang & Tối ưu Bundle Size (Performance & User Experience)
- **Là một** người dùng nông dân ngoài thực địa (AgriVision) hoặc kỹ sư trạm (Station),
- **Tôi muốn** ứng dụng khởi động nhanh, tải nhẹ trên mạng 3G/4G chập chờn,
- **Để** không phải tải hàng chục megabyte mã nguồn chết (Dead Code) và các thư viện bản đồ trùng lặp.

### User Story 3: Nhất quán Dữ liệu Thực thể (Data Integrity & Single Source of Truth)
- **Là một** người dùng tạo hoặc chỉnh sửa một cánh đồng/vùng trồng,
- **Tôi muốn** dữ liệu cập nhật đồng bộ tức thì trên toàn bộ giao diện (Bản đồ, Danh sách, Thẻ chẩn đoán),
- **Để** không gặp phải tình trạng "bất nhất dữ liệu" do các store độc lập lưu cache riêng rẽ.

---

## Clarifications

### Session 2026-09-12
- Q: Xử lý các tệp tin Dead Code và Re-export Shims như thế nào? → A: Xóa bỏ hoàn toàn (`src/components/AdminPanel`, `src/config/api.js`, `src/constants/theme.js`, `src/modules/legacy`, `@core/components/GridShell`, và 10 redirect thừa tại `(station)/*.js`).
- Q: Hợp nhất các store quản lý thực thể cánh đồng như thế nào? → A: Hợp nhất theo chuẩn 12-Factor App thành một Canonical Field Store duy nhất tại `@core/store/useFieldStore.js` (Single Source of Truth, phân định ranh giới rõ ràng giữa Domain Entity cache và View GIS state).
- Q: Định hướng công nghệ bản đồ (Map Stack)? → A: Giữ MapLibre GL cho Station Web, React Native Maps cho Mobile Native, chuẩn hóa dữ liệu bản đồ qua GeoJSON adapter dùng chung.
- Q: Yêu cầu về độ bền vững và thiết kế kiểm thử? → A: Thiết kế lại bộ test để chịu được các bài test tư duy nghịch đảo (Inversion Thinking: mạng đứt giữa chừng, store race conditions, corrupted cache, malformed GeoJSON).

---

## 3. Functional Requirements & Scope Boundaries

### Yêu cầu Chức năng (Functional Requirements)
- **FR-001 (Dọn dẹp Dead Code & Stubs)**: Loại bỏ triệt để các thư mục stub rỗng: `App/src/components/AdminPanel/`, `App/src/config/api.js`, `App/src/constants/theme.js`, và module chết `App/src/modules/legacy/`.
- **FR-002 (Cắt đứt Chuỗi Re-export Đa tầng)**: Gỡ bỏ shim re-export tại `App/src/modules/@core/components/GridShell/`. Các component thực sự cần dùng GridShell sẽ import trực tiếp từ module chủ quản hoặc tách thành widget dùng chung tại `@core`.
- **FR-003 (Sửa chữa Layer Inversion)**: Chuyển các hằng số màu sắc nền tảng (`THEME_MODES`, `PALETTES`) vào đúng vị trí tại `@core/constants/theme.js`. Đảm bảo `@core` không bao giờ import từ `agrivision` hay `station`.
- **FR-004 (Hợp nhất Store Thực thể Fields - 12-Factor App)**: Hợp nhất `useFieldStore.js` (store/) và `fieldStore.js` (stores/) thành một Canonical Field Store duy nhất tại `@core/store/useFieldStore.js` tuân thủ nguyên lý Single Source of Truth và Statelessness.
- **FR-005 (Phẫu thuật Tách nhỏ Tệp tin Quá khổ - Rule 2.1)**:
  - Tách `diagnosis-result.js` (825 dòng): Đưa StyleSheet ra tệp riêng `diagnosisResult.styles.js`, tách các thẻ hiển thị (`DiseaseOverviewCard`, `TreatmentAccordion`, `DiagnosisImageHeader`) thành component con độc lập dưới 150 dòng.
  - Tách `MobileZoneCultivationScreen.jsx` (912 dòng) và `StationMapCanvasMapLibre.web.jsx` (1,084 dòng) thành các hook xử lý logic và sub-components riêng biệt.
- **FR-006 (Đơn giản hóa Định tuyến Expo Router)**:
  - Xóa bỏ các tệp redirect đệm `App/app/(station)/*.js` trỏ vào `App/app/(station)/station/*` bằng cách chuẩn hóa cấu trúc thư mục route.
  - Đánh dấu lộ trình đóng hoàn toàn nhóm route cũ `App/app/(main)/`.
- **FR-007 (Chuẩn hóa Bản đồ & Tinh giản Phụ thuộc)**: Lập lộ trình thống nhất: Web dùng `maplibre-gl` (hoặc Leaflet thuần), Native dùng `react-native-maps`, loại bỏ thư viện bản đồ dư thừa.
- **FR-008 (Bộ Kiểm thử Nghịch đảo Inversion Testing & Adversarial Hardening)**: Thiết kế bộ test tự động (`inversionStress.test.js`) kiểm chứng:
  1. Mất kết nối mạng ngắt quãng trong quá trình đồng bộ và fetch dữ liệu.
  2. Bão gọi đồng thời (Race Conditions) trên Store khi nhiều màn hình cùng thao tác dữ liệu.
  3. Khả năng tự phục hồi khi bộ nhớ cache cục bộ / AsyncStorage bị hỏng cấu trúc (Corrupted JSON).
  4. Phòng thủ chống lỗi dữ liệu không gian dị tật (Malformed GeoJSON: tọa độ rỗng, tự cắt, đảo cực).

---

## 4. Systematic 5-Dimension Trade-Off Analysis (Rule 2.7)

Chúng tôi đánh giá 3 kịch bản giải pháp khả dĩ:
- **Phương án A (Surgical Pruning & Layer Normalization - KHUYẾN NGHỊ)**: Dọn dẹp mã chết, xóa bỏ shims trung gian, sửa layer inversion `@core`, hợp nhất store trùng lặp, tách nhỏ các file khổng lồ (>500 dòng). Giữ nguyên tech stack và contract.
- **Phương án B (Full Clean-Architecture Rewrite)**: Viết lại toàn bộ frontend bằng TypeScript thuần, tái thiết kế toàn bộ routing, thay thế React Native Maps và Leaflet bằng một engine thống nhất duy nhất.
- **Phương án C (Status Quo / Minimal Touch)**: Chỉ xóa 2 thư mục stub có comment DEAD CODE (`AdminPanel`, `config/api.js`), giữ nguyên toàn bộ shims, 4 store và các file 1,000 dòng.

### Bảng Đánh giá Trade-off 5 Chiều:

| Tiêu chí Đánh giá (Dimension) | Phương án A: Surgical Pruning (Khuyến nghị) | Phương án B: Full Rewrite | Phương án C: Status Quo |
| :--- | :--- | :--- | :--- |
| **1. Tài nguyên Hệ thống (System Resources)** | **Cao (+30%)**: Giảm bundle size ~5MB, dọn RAM trình duyệt, loại bỏ re-render ảo do store trùng lặp. | **Rất cao (+45%)**: Bundle size tối ưu nhất, loại bỏ hoàn toàn 2 thư viện map. | **Kém**: Giữ nguyên bundle phình to, nạp cả 3 thư viện map và shims vào bộ nhớ. |
| **2. Độ phức tạp (Complexity)** | **Thấp**: Bán kính phẫu thuật hẹp, giữ nguyên API contracts, không phá vỡ UI screens. | **Cực cao**: Rủi ro phá vỡ toàn bộ giao diện, regressions cao, tốn hàng tuần kiểm thử lại E2E. | **Cao (Cognitive Load)**: Lập trình viên mới bị lạc giữa 4 store cùng tên và 3 tầng shims. |
| **3. Độ ổn định Dài hạn (Long-Term Stability)** | **Rất cao**: Cắt bỏ các vòng xoáy phụ thuộc (cycle dependencies) và sửa layer inversion, chống rò rỉ bộ nhớ. | **Trung bình ngắn hạn**: Rủi ro lỗi phát sinh mới trong giai đoạn viết lại. | **Kém**: Dễ phát sinh race-condition dữ liệu giữa 4 store cánh đồng. |
| **4. Khả năng Mở rộng (Extensibility)** | **Cao**: Module `@core` độc lập, dễ dàng bổ sung tính năng mới cho AgriVision hoặc Station. | **Rất cao**: Kiến trúc chuẩn chỉ từ đầu. | **Thấp**: Mỗi lần thêm tính năng mới phải tự hỏi nên gọi store nào trong 4 store. |
| **5. Khả năng Bảo trì (Maintainability)** | **Rất cao**: Tuân thủ Rule 2.1 (file < 300 dòng), cấu trúc thư mục sạch, 0 dead code. | **Cao** (sau khi hoàn thành). | **Rất kém**: 25 file vượt 300 dòng, không có linter, nợ kỹ thuật chồng chất. |

---

## 5. Success Criteria (Measurable & Technology-Agnostic)

1. **Dead Code Elimination**: 100% các file stub và shims trung gian được đánh dấu dọn dẹp không còn hiện diện trong codebase production.
2. **Zero Layer Inversion**: Thư mục `@core` hoàn toàn độc lập, không chứa bất kỳ import nào trỏ ngược vào các module tính năng cấp cao.
3. **Single Source of Truth**: Mỗi thực thể nghiệp vụ (Field, Zone, Sample) chỉ có duy nhất 1 store quản lý dữ liệu canonical.
4. **File Size Compliance (Rule 2.1)**: 100% các tệp màn hình chính được chia nhỏ để không vượt quá trần 300 dòng mã nguồn.
5. **Zero Functional Regression**: Toàn bộ các bộ test tự động (Jest & Playwright E2E) đạt tỷ lệ vượt qua $\ge 90\%$ (mục tiêu 100%).
6. **Zero Runtime Route Collisions**: Không còn cảnh báo xung đột route trong console của Expo Router.
