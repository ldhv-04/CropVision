# Feature Specification: Comprehensive 12-Factor App & Architectural Resilience Refactor

**Feature Branch**: `003-refactor-12factor-hardening`  
**Created**: 2026-09-12  
**Status**: Draft (Gated at /speckit-specify - Awaiting User Idea Lock-In)  
**Input**: User description: "/speckit-specify từ các vấn đề trên, lên kế hoạch thực hiện refactor cải thiện tất cả nhược điểm đang có. Phải đảm bảo kiến trúc chính, các quy tắc, ràng buộc của kiến trúc. Hạn chế phá codebase và dùng các tư duy áp dụng vào để thay đổi và nâng cấp hệ thống một cách toàn diện đạt chuẩn 12 factor-app"

---

## 1. Mục tiêu & Định hướng Giải pháp (Solution Framing)

### 1.1 Vấn đề Cốt lõi Cần Giải quyết
Từ cuộc khảo sát kiến trúc chuyên sâu, hệ thống CropVision tồn tại 4 nhóm nhược điểm kiến trúc cần được tái cấu trúc (refactor):
1. **Thiếu vắng Tính năng Ngoại tuyến (Offline-First Deficit - Rule 1.1.3)**: Thiết bị di động không thể lưu trữ hay thao tác khi mất sóng 4G/3G ngoài thực địa.
2. **Lãng phí Tài nguyên & Tràn RAM do Base64 Payload (Rule 1.2.1)**: Chuỗi Base64 ảnh 10MB nhúng trong JSON gây nghẽn mạng và phình to Heap RAM.
3. **Vi phạm Chuẩn 12-Factor App**:
   - *Factor III (Config)*: Thiếu schema validation fail-fast cho cấu hình môi trường.
   - *Factor VI (Processes)*: Lưu ảnh vật lý trong `backend/uploads/` ngăn cản scale-out đa container.
   - *Factor VIII (Concurrency)*: Phép tính giao cắt không gian dịch tễ chạy đồng bộ trong luồng chính gây nghẽn Event Loop.
   - *Factor IX (Disposability)*: Thiếu cơ chế Graceful Shutdown (`SIGTERM`/`SIGINT`) cho Express và pg Pool.
   - *Factor XI (Logs)*: Thiếu structured logging (JSON stream) với correlation ID.
4. **Nút thắt Không gian & Phình to Tệp tin (Rule 1.6 & Rule 2.1)**: Quét toàn bộ sub-zones vào RAM thay vì spatial pre-filtering; nhiều file lõi > 300 dòng.

### 1.2 Nguyên tắc Dẫn đường (Guiding Invariants)
- **Minimal Change Principle (Rule 2.13)**: Refactor có chọn lọc, phẫu thuật trúng đích (Surgical Blast Radius), bảo toàn các API contracts hiện hành, không gây vỡ codebase ("Hạn chế phá codebase").
- **Tư duy Ngược (Inversion Thinking)**: Thiết kế phòng thủ trước các kịch bản cực đoan (mất mạng đột ngột, server restart giữa chừng, bão request đồng thời).
- **Tuân thủ Chuẩn 12-Factor App**: Đưa toàn bộ hệ sinh thái dịch vụ đạt chuẩn đám mây hiện đại.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Khả năng Trinh sát Ngoại tuyến Bền bỉ (Offline-First Field Scout) (Priority: P1)
Là kỹ sư nông học thực địa, tôi cần ứng dụng di động cho phép chụp ảnh lá cây, nhận diện cục bộ (hoặc đưa vào hàng đợi chờ đồng bộ) và lưu vết GPS đi bộ ngay cả khi hoàn toàn mất sóng di động ngoài ruộng.

- **Why this priority**: Trực tiếp giải quyết định vị sản phẩm "Optical Field Scout" tại các vùng canh tác hẻo lánh.
- **Independent Test**: Kích hoạt Airplane Mode trên thiết bị; thực hiện quét bệnh và đi bộ đo ranh giới; tắt Airplane Mode và xác minh dữ liệu tự động đồng bộ lên máy chủ.
- **Acceptance Scenarios**:
  1. **Given** thiết bị di động không có kết nối Internet, **When** người dùng chụp ảnh lá cây và bấm phân tích, **Then** hệ thống lưu ảnh và thông tin vào hàng đợi cục bộ (`AsyncStorage` / SQLite), hiển thị trạng thái "Đang chờ đồng bộ".
  2. **Given** kết nối Internet được phục hồi, **When** ứng dụng phát hiện mạng khả dụng, **Then** tiến trình nền tự động đồng bộ tuần tự các mẫu vật lên máy chủ và thông báo cho người dùng.

---

### User Story 2 - Loại bỏ Lãng phí Bộ nhớ & Tối ưu Hóa API Ingress (Priority: P2)
Là kỹ sư hạ tầng backend, tôi cần API `/api/inference/analyze` loại bỏ hoàn toàn chuỗi Base64 khổng lồ trong JSON response và chỉ trả về siêu dữ liệu (bounding boxes, nhãn bệnh, độ tin cậy, URL ảnh).

- **Why this priority**: Cắt giảm 50% độ trễ API, tiết kiệm 40% RAM máy chủ và giảm 30% băng thông 4G thực địa (Rule 1.2.1).
- **Independent Test**: Gửi 10 ảnh dung lượng 10MB đồng thời; đo lường kích thước JSON payload trả về (< 2 KB thay vì > 13 MB) và heap delta của Node.js.
- **Acceptance Scenarios**:
  1. **Given** ảnh lá cây 10MB được phân tích thành công bởi AI Core, **When** backend trả về kết quả cho client, **Then** response body không chứa trường `image_base64`, client hiển thị ảnh cục bộ đã chụp kết hợp với bounding boxes tọa độ chuẩn.

---

### User Story 3 - Chuẩn hóa 12-Factor App (Config, Stateless Storage, Graceful Disposability) (Priority: P3)
Là kỹ sư DevOps / SRE, tôi cần máy chủ Express và AI Core có thể scale-out ngang không giới hạn, nạp cấu hình có schema fail-fast, đóng kết nối an toàn khi nhận `SIGTERM`, và xuất log dạng stream có cấu trúc.

- **Why this priority**: Đảm bảo tính ổn định dài hạn (Long-Term Stability) và tính tương thích cao với Docker Swarm / Kubernetes.
- **Independent Test**: Khởi động backend thiếu biến bắt buộc $\rightarrow$ Báo lỗi fail-fast; gửi tín hiệu `SIGTERM` khi đang có request $\rightarrow$ Hoàn tất request và đóng pool sạch sẽ.
- **Acceptance Scenarios**:
  1. **Given** máy chủ backend đang xử lý request, **When** tiến trình nhận tín hiệu `SIGTERM`, **Then** server ngừng nhận kết nối mới, đợi tối đa 10 giây để hoàn tất các request đang chạy, đóng PostgreSQL pool và thoát với mã 0.
  2. **Given** cấu hình lưu trữ, **When** hệ thống lưu ảnh tải lên, **Then** sử dụng Storage Adapter trừu tượng (hỗ trợ Local Volume ở môi trường dev và S3/MinIO ở production).

---

### User Story 4 - Tối ưu Hóa Lan truyền Dịch tễ Bằng Bounding-Box Pre-Filter (Priority: P4)
Là người quản trị trạm điều hành, tôi cần hệ thống tính toán nón lan truyền dịch tễ nhanh chóng mà không làm nghẽn Event Loop của máy chủ khi số lượng vùng trồng tăng cao.

- **Why this priority**: Ngăn ngừa sự cố quá tải đơn luồng (Single-thread CPU starvation).
- **Independent Test**: Bắn 50 requests đồng thời quét nón dịch bệnh trên 500 vùng trồng; thời gian nghẽn Event Loop duy trì dưới 30ms (giảm >75% so với mức 143.62 ms ban đầu).
- **Acceptance Scenarios**:
  1. **Given** một vùng trồng báo cáo dịch bệnh, **When** tìm kiếm các vùng trồng gặp nguy cơ, **Then** câu truy vấn SQL chỉ lấy các vùng nằm trong phạm vi Bounding Box tọa độ của nón nguy hiểm trước khi tính toán hình học chi tiết bằng Turf.js.

---

## 3. Requirements *(mandatory)*

### 3.1 Functional Requirements
- **FR-001**: Xây dựng module `OfflineSyncService` phía frontend di động sử dụng `AsyncStorage` để lưu trữ hàng đợi ngoại tuyến cho mẫu vật và tọa độ GPS.
- **FR-002**: Tinh giản API `/api/inference/analyze`: Xóa bỏ việc mã hóa lại Base64 trong Python [`predict.py`](file:///home/terminator/Project/active/CropVision/ai_core/api/predict.py) và Node.js response; frontend hiển thị ảnh gốc từ thiết bị kết hợp bounding boxes.
- **FR-003**: Chuẩn hóa **12-Factor Factor III (Config)**: Xây dựng module cấu hình fail-fast (`env.js`) kiểm tra chặt chẽ các biến bắt buộc (`PORT`, `JWT_SECRET`, `DB_*`, `AI_CORE_URL`) ngay khi khởi động.
- **FR-004**: Chuẩn hóa **12-Factor Factor VI (Stateless Processes)**: Tạo interface `storageAdapter` cho backend (`localStorageAdapter.js` và sẵn sàng cho `s3StorageAdapter.js`).
- **FR-005**: Chuẩn hóa **12-Factor Factor IX (Disposability)**: Bổ sung handler `SIGTERM` / `SIGINT` trong `server.js` để thực hiện Graceful Shutdown hoàn chỉnh.
- **FR-006**: Chuẩn hóa **12-Factor Factor XI (Logs)**: Chuyển đổi logging sang định dạng có cấu trúc (timestamp, level, context).
- **FR-007**: Bổ sung cơ chế **Bounding Box Spatial Pre-filtering** trong [`epidemicController.js`](file:///home/terminator/Project/active/CropVision/backend/src/controllers/epidemicController.js) để giảm thiểu tập dữ liệu sub-zones cần nạp vào RAM.
- **FR-008**: Bổ sung **Idempotency Key** (`X-Idempotency-Key`) cho API tạo báo cáo dịch bệnh `/api/disease/report` để chống lặp cảnh báo.
- **FR-009**: Đảm bảo **Minimal Change Principle (Rule 2.13)**: Giữ nguyên 100% các route paths, database schemas hiện hữu; các thay đổi chỉ diễn ra cục bộ trong phạm vi adapter và service.
- **FR-010**: Duy trì tỷ lệ pass test suite của backend ở mức **100% (7/7 suites PASS)**.

---

## 4. Success Criteria *(mandatory)*

- **SC-001**: Ứng dụng di động hoạt động không lỗi khi mất kết nối mạng và tự động đồng bộ dữ liệu sau khi có sóng.
- **SC-002**: Kích thước JSON response của `/api/inference/analyze` giảm **> 95%** (từ ~14MB xuống < 5KB đối với ảnh 10MB).
- **SC-003**: Máy chủ Express tắt an toàn (Graceful Shutdown) trong vòng < 2s mà không làm đứt gãy kết nối client đang dở dang.
- **SC-004**: Thời gian nghẽn Event Loop dưới bão 50 requests dịch tễ giảm **> 70%** (duy trì dưới 40ms).
- **SC-005**: 100% bộ kiểm thử tự động của hệ thống (Backend Jest, App Jest, AI Core Pytest) tiếp tục vượt qua thành công với 0 regressions.
- **SC-006**: Bán kính tác động (Blast radius) kiểm toán được kiểm soát chặt chẽ, không phát sinh thêm tệp tin vi phạm Rule 2.1 (> 300 LOC).

---

## 5. Assumptions & Constraints
1. Dự án tiếp tục giữ nguyên ngăn xếp công nghệ: Express 5.2, FastAPI, PostgreSQL 16, Expo React Native.
2. Không bắt buộc cài đặt cluster PostGIS phức tạp trong đợt này nếu Bounding Box pre-filter SQL giải quyết được nút thắt hiệu năng.

## Clarifications

### Session 2026-09-12
- Q: Loại bỏ trường image_base64 khỏi API inference và đọc ảnh cục bộ trên Mobile App? → A: Đồng ý loại bỏ để giảm 95% payload size và tiết kiệm 40% RAM.
- Q: Cấu hình Storage Adapter hỗ trợ cả Local Disk và S3/MinIO? → A: Đồng ý tạo interface Storage Adapter trừu tượng để đáp ứng 12-Factor Factor VI.
- Q: Phạm vi ngoại tuyến cho Mobile App? → A: Đồng ý tích hợp cơ chế OfflineSyncManager cho cả Mẫu bệnh lá cây (Leaf Diagnosis) và Vết đi bộ ranh giới GPS (Walk Boundary).
