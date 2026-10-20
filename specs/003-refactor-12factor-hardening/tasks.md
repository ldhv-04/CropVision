# Tasks: Comprehensive 12-Factor App & Architectural Resilience Refactor

**Branch**: `003-refactor-12factor-hardening` | **Date**: 2026-09-12 | **Plan**: [plan.md](plan.md)

## Tasks Breakdown

- [x] **Task 1: 12-Factor Config Fail-Fast & Graceful Disposability**
  - Path: `backend/src/config/env.js`, `backend/server.js`
  - Mô tả: Xây dựng module `env.js` kiểm tra và xác thực các biến môi trường bắt buộc. Bổ sung listener bắt `SIGTERM`/`SIGINT` trong `server.js` để đóng kết nối Express và PostgreSQL pool sạch sẽ.
  - Nghiệm thu: Server khởi động báo lỗi rõ ràng nếu thiếu biến; đóng kết nối an toàn khi gửi tín hiệu ngắt.

- [x] **Task 2: 12-Factor Stateless Storage Adapter**
  - Path: `backend/src/services/storageAdapter.js`, `backend/src/services/inferenceService.js`
  - Mô tả: Tạo interface `StorageAdapter` trừu tượng hóa việc lưu trữ ảnh. Tích hợp `LocalStorageAdapter` vào `inferenceService.js` thay cho việc gọi trực tiếp `fs.promises.writeFile`.
  - Nghiệm thu: Lưu file ảnh thành công và trả về URL ảnh chuẩn xác; tiến trình backend không bị gắn chặt cứng vào filesystem cục bộ.

- [x] **Task 3: Loại bỏ Base64 Payload Bloat (Rule 1.2.1)**
  - Path: `ai_core/api/predict.py`, `backend/src/controllers/inferenceController.js`, `App/app/(agrivision)/diagnosis-result.js`
  - Mô tả: Bỏ bước mã hóa base64 trong Python và bỏ trường `image_base64` trong response API. Cập nhật frontend để đọc ảnh từ URI cục bộ của thiết bị.
  - Nghiệm thu: Kích thước response JSON giảm từ ~14MB xuống < 5KB; ảnh và bounding boxes hiển thị chính xác trên Mobile.

- [x] **Task 4: Tối ưu Hóa Bão Đồng Thời Dịch tễ (Spatial Pre-filtering)**
  - Path: `backend/src/controllers/epidemicController.js`
  - Mô tả: Bổ sung bộ lọc tọa độ hộp bao (Bounding Box) trên câu truy vấn SQL trước khi chạy thuật toán kiểm tra va chạm Turf.js.
  - Nghiệm thu: Giảm số lượng sub-zones cần tính toán trong RAM; thời gian xử lý nón dịch tễ giảm đáng kể.

- [x] **Task 5: Xây dựng Module Ngoại tuyến (Offline-First) cho Mobile**
  - Path: `App/src/modules/@core/offline/offlineSyncManager.js`
  - Mô tả: Xây dựng hàng đợi ngoại tuyến `PENDING_SAMPLES` và `PENDING_WALKS` dựa trên `AsyncStorage` cho ứng dụng di động.
  - Nghiệm thu: Khi offline, dữ liệu được ghi vào storage cục bộ an toàn; cung cấp hàm `syncPendingItems()` đẩy dữ liệu khi có mạng.

- [x] **Task 6: Kiểm chứng Toàn diện & Xác thực Zero-Regression**
  - Mô tả: Chạy toàn bộ các bộ kiểm thử: Backend Jest (7/7 suites), App Jest (3/3 suites), AI Core Pytest (5/5 tests).
  - Nghiệm thu: 100% tests vượt qua thành công, 0 lỗi hồi quy, pre-commit diff được kiểm toán tối thiểu.
