# Feature Specification: Architecture Integrity & Antigravity Governance Hardening

**Feature Branch**: `001-arch-integrity-hardening`  
**Created**: 2026-09-12  
**Status**: Draft (Gated at /speckit-specify - Awaiting User Idea Lock-In)  
**Input**: User description: "/speckit-specify sử dụng /understand để quét qua toàn bộ thư mục và kiến trúc của source code. Tìm ra các vấn đề tồn động trong kiến trúc và cách tổ chức phần mềm. Đảm bảo tuân rủ ràng buộc, rules của antigravity với project AIIC_label tools. Sử dụng các tư duy ngược, tư duy inversion và quy tắc minimal change principle để thực hiện task này, khảo sát chi tiết và đo lường cụ thể thông qua test, không dựa vào dự đoán mù. Nếu phần mềm, kiến trúc có lỗ hổng hay có vấn đề, cần đưa ra số liệu cụ thể từ bài test khó nhất."

---

## 1. Executive Problem Formulation & Inversion Analysis

### 1.1 Inversion Framing (Tư duy ngược)
Thay vì chỉ đặt câu hỏi "Hệ thống cần tính năng gì để chạy?", phương pháp tư duy ngược (Inversion Thinking) đặt câu hỏi:
> **"Điều gì sẽ làm CropVision sụp đổ hoàn toàn trong môi trường thực địa hoặc khi mở rộng quy mô?"**

Qua kiểm toán thực nghiệm và benchmark đo lường trực tiếp:
1. **Sụp đổ kiểm thử & Tiến trình CI/CD (28.6% Test Failure Rate)**: 
   - Bài test khó nhất hiện tại (`tests/fieldRedesign.test.js` & `tests/homepage.test.js`) thất bại 100% khi chạy qua Jest (`TypeError: app.address is not a function`, `SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`).
   - Nguyên nhân gốc rễ: `backend/server.js` không xuất `module.exports = app`, tự động gọi `startServer()` khi `require()`, mở socket database treo mà không có teardown lifecycle.
2. **Nghẽn Single-Thread Event Loop dưới bão đồng thời (Concurrency Storm)**:
   - Module tính toán dịch bệnh (`POST /api/epidemic/report`) truy vấn toàn bộ sub-zones trong toàn hệ thống vào RAM Node.js (`SELECT ... FROM sub_zones sz WHERE sz.id != $1`) và chạy thuật toán hình học Turf.js tuần tự.
   - Đo lường thực tế: 50 requests đồng thời làm nghẽn CPU Node.js tới 143.62 ms, khiến toàn bộ API khác của trạm điều hành bị treo.
3. **Thiếu cơ chế Rollback & Giao dịch nguyên tử (Atomicity & Rollback Deficit)**:
   - 100% database migrations (5/5) trong `backend/initdb/` thiếu `down.sql` (vi phạm Rule 2.3).
   - Module dịch bệnh thực hiện hàng chục câu lệnh `INSERT`/`UPDATE` không có transaction (`BEGIN ... COMMIT`), dẫn đến nguy cơ sai lệch trạng thái (State Desync) vĩnh viễn khi có sự cố mạng/máy chủ.
4. **Phình to bộ nhớ với Base64 Payload & Rò rỉ tài nguyên (Rule 1.2.1 & 1.6.1)**:
   - Ảnh lá cây 10MB sau khi inference bị mã hóa Base64 thành payload 13.98 MB chuyển qua lại giữa Python AI Core -> Node.js Express -> React Native Client, gây đột biến Heap RAM 3.3x–5x.
5. **Vi phạm giới hạn kích thước mô-đun (Rule 2.1)**:
   - 34 file mã nguồn (11.1% codebase) vượt quá trần 300 dòng. Tệp lớn nhất đạt 1,084 dòng (`StationMapCanvasMapLibre.web.jsx`).

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Phục hồi tính toàn vẹn kiểm thử tích hợp (Priority: P1)
Là một kỹ sư nông học và nhà phát triển hệ thống, tôi cần bộ kiểm thử tích hợp cốt lõi (đặc biệt là bài test khó nhất `fieldRedesign.test.js` và `homepage.test.js`) thực thi đạt 100% thành công với môi trường cấu hình chuẩn, ngắt kết nối an toàn và không gây rò rỉ socket/tiến trình.

- **Why this priority**: Không thể đảm bảo tính ổn định lâu dài (Long-Term Stability) và quy tắc kiểm chứng thực nghiệm (Rule 2.9) nếu 28.6% bộ test suite cốt lõi không thể khởi động.
- **Independent Test**: Chạy `npm test` trong `backend/` đạt 7/7 test suites PASS, 0 unhandled error socket, 0 leak handles.
- **Acceptance Scenarios**:
  1. **Given** môi trường kiểm thử với các biến môi trường cấu hình chuẩn (`JWT_SECRET`, `DB_*`), **When** Jest chạy `tests/fieldRedesign.test.js`, **Then** server khởi tạo dưới dạng module biệt lập, thực thi toàn bộ suite và trả về kết quả thành công.
  2. **Given** bài test hoàn tất, **When** Jest thực hiện teardown, **Then** tất cả kết nối PostgreSQL pool và server listener đóng hoàn toàn, không ném lỗi `ERR_UNHANDLED_ERROR` hay `pgPass is not a function`.

---

### User Story 2 - Phòng thủ bão đồng thời & Tối ưu hóa lan truyền dịch tễ (Priority: P2)
Là trạm điều hành nông nghiệp (Station Admin), tôi cần hệ thống có thể tiếp nhận và xử lý báo cáo dịch bệnh từ hàng chục kỹ sư trinh sát thực địa cùng lúc mà không làm treo bảng điều khiển GIS hoặc nghẽn event-loop Node.js.

- **Why this priority**: Dịch bệnh lan truyền nhanh cần cảnh báo tức thì; sự tắc nghẽn event loop sẽ vô hiệu hóa toàn bộ trạm điều hành khi có đợt bùng phát thực địa.
- **Independent Test**: Bắn kịch bản bão đồng thời 50 requests tính toán nón nguy hiểm 500 sub-zones; thời gian trễ trung bình của event-loop duy trì dưới 30ms.
- **Acceptance Scenarios**:
  1. **Given** một thửa ruộng báo cáo dịch bệnh mới, **When** hệ thống quét các vùng trồng gặp nguy hiểm, **Then** chỉ các vùng nằm trong bounding box/phạm vi bán kính mới được nạp vào kiểm tra va chạm hình học (spatial pre-filtering), thay vì quét mù toàn bộ bảng `sub_zones`.
  2. **Given** quá trình phát cảnh báo cho $N$ vùng trồng nguy cơ, **When** xảy ra lỗi ở vùng thứ $k$, **Then** transaction database bảo toàn tính toàn vẹn (hoặc hoàn tất nguyên tử, hoặc rollback an toàn, có logging chi tiết).

---

### User Story 3 - Chuẩn hóa 12-Factor Config & Bổ sung Rollback Matrix (Priority: P3)
Là kỹ sư vận hành hạ tầng (DevOps/SRE), tôi cần cấu hình môi trường đồng nhất giữa Docker Compose và Local Development, cùng với 100% kịch bản rollback (`down.sql`) cho cơ sở dữ liệu.

- **Why this priority**: Tuân thủ Rule 2.3 (Reversible Migrations & Rollback) và Rule 2.11 (12-Factor App Fail-Fast).
- **Independent Test**: Kiểm tra cú pháp và khả năng đảo ngược của từng migration: `up.sql` -> migrate -> `down.sql` -> rollback về trạng thái trước sạch sẽ.
- **Acceptance Scenarios**:
  1. **Given** một tệp di trú cơ sở dữ liệu bất kỳ trong `backend/initdb/`, **When** quản trị viên kích hoạt rollback, **Then** tệp `down.sql` tương ứng hủy bỏ an toàn các bảng/chỉ mục mới tạo mà không mất dữ liệu liên quan.
  2. **Given** backend khởi động cục bộ thiếu cấu hình khóa mật hoặc cơ sở dữ liệu, **When** module cấu hình nạp, **Then** hệ thống fail-fast thông báo rõ biến thiếu thay vì kết nối ngầm với giá trị `undefined`.

---

## 3. Edge Cases & Inversion Failure Modes

1. **Degenerate Polygons (Đa giác biến dạng)**: Đa giác tự cắt (bowtie), đa giác thẳng hàng (< 3 điểm duy nhất), tọa độ chứa `NaN`/`null`. Hệ thống phải lọc bỏ và trả về kết quả an toàn (đã đo lường: `HANDLED_GRACEFULLY`).
2. **Unannounced DB Connection Reset**: PostgreSQL đóng socket do timeout hoặc restart. `pool.on('error')` không được gọi `process.exit(-1)` làm chết cụm dịch vụ mà cần kích hoạt retry policy với exponential backoff.
3. **Payload Bloat**: Thiết bị di động tải lên ảnh 10MB; AI Core xử lý trả về bounding box nhưng không chuyển ngược Base64 khổng lồ qua JSON nếu client đã có sẵn ảnh gốc cục bộ.

---

## 4. Requirements *(mandatory)*

### 4.1 Functional Requirements
- **FR-001**: `backend/server.js` PHẢI xuất `module.exports = app` và chỉ kích hoạt `app.listen()` khi được thực thi trực tiếp (`require.main === module`).
- **FR-002**: `backend/src/middleware/authMiddleware.js` PHẢI kiểm tra `JWT_SECRET` với thông điệp fail-fast rõ ràng nhưng cho phép inject secret giả lập trong môi trường test mà không sập module load.
- **FR-003**: `backend/src/config/db.js` PHẢI đồng bộ hóa biến môi trường với root `.env` (`DB_*` và fallback `POSTGRES_*`), loại bỏ lệnh `process.exit(-1)` cưỡng bức tại event listener `error`.
- **FR-004**: Tất cả 5 database migrations trong `backend/initdb/` PHẢI có tệp đối ứng `down.sql` thực hiện rollback an toàn.
- **FR-005**: Tiến trình tạo cảnh báo dịch bệnh trong `backend/src/controllers/epidemicController.js` PHẢI được bọc trong database transaction (`BEGIN ... COMMIT / ROLLBACK`).
- **FR-006**: Truy vấn tìm kiếm vùng trồng trong nguy cơ PHẢI áp dụng bộ lọc bounding box (Spatial Bounding Box / PostGIS ST_DWithin giả lập) để giảm tập dữ liệu trước khi chạy Turf.js.
- **FR-007**: Tuyệt đối tuân thủ **Quy tắc Thay đổi Tối thiểu (Minimal Change Principle - Rule 2.13)**: Không refactor ồ ạt, không viết lại các file >300 dòng nếu không phục vụ trực tiếp việc sửa lỗi kiến trúc.

---

## 5. Success Criteria *(mandatory)*

- **SC-001**: Bộ kiểm thử backend (`npm test`) tăng tỷ lệ thành công từ **71.4% (5/7)** lên **100% (7/7 test suites PASS)**.
- **SC-002**: Bài test khó nhất `tests/fieldRedesign.test.js` vượt qua 100% các assertions khi chạy với database cục bộ.
- **SC-003**: 100% migration (5/5) có kịch bản `down.sql` hoàn chỉnh, tỷ lệ phủ rollback đạt 100% (từ 0% hiện tại).
- **SC-004**: Tải đồng thời 50 requests tính toán lan truyền dịch tễ không làm nghẽn event loop quá 50ms (giảm >65% so với mức 143.62 ms hiện tại).
- **SC-005**: Không phát sinh thêm bất kỳ tệp tin nào vượt ngưỡng 300 dòng theo Rule 2.1.
- **SC-006**: Số dòng mã thay đổi thực tế được kiểm toán tối thiểu (Minimal Delta), blast radius chỉ giới hạn ở các tệp cấu hình và cổng nối lỗi.

---

## 6. Assumptions
1. PostgreSQL 16 chạy trên cổng 5432 (container `cropvision-db`).
2. AI Core YOLOv8 chạy trên cổng 8000 (container `cropvision-ai-core`).
3. Môi trường phát triển cục bộ có Node.js v22.

## Clarifications

### Session 2026-09-12
- Q: Sửa bài test khó nhất bằng cách nào? → A: Áp dụng Option A (Surgical Blast Radius Remediation) xuất module.exports = app và quản lý vòng đời socket/pool.
- Q: Xử lý nón lan truyền dịch tễ bằng Turf.js hay PostGIS? → A: Giữ Turf.js trong Node.js kết hợp bounding box filter và bọc Database Transaction (BEGIN...COMMIT), không kéo thêm PostGIS.
- Q: Xử lý 34 tệp vượt 300 dòng ra sao? → A: Tuân thủ Minimal Change Principle (Rule 2.13), không refactor ồ ạt, chỉ ghi nhận Technical Debt để tránh rủi ro hồi quy.
