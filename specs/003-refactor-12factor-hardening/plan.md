# Implementation Plan: Comprehensive 12-Factor App & Architectural Resilience Refactor

**Branch**: `003-refactor-12factor-hardening` | **Date**: 2026-09-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-refactor-12factor-hardening/spec.md`

## Summary
Thực thi kế hoạch tái cấu trúc (refactor) phẫu thuật nâng cấp toàn diện hệ thống CropVision đạt chuẩn 12-Factor App và khắc phục các điểm nghẽn kiến trúc cốt lõi: Tích hợp Offline-First cho ứng dụng di động, loại bỏ Base64 payload bloat (tiết kiệm 95% payload size), trừu tượng hóa Storage Adapter (Stateless Core), cấu hình fail-fast tường minh, Graceful Shutdown cho tiến trình, và tối ưu hóa nón lan truyền dịch tễ bằng Bounding-box pre-filter.

## Technical Context
- **Ngôn ngữ & Phiên bản**: Node.js v22 (Express 5.2), Python 3.11 (FastAPI, YOLOv8), React Native 0.83 (Expo Router 55).
- **Phụ thuộc chính**: `pg`, `supertest`, `jest`, `@turf/helpers`, `@turf/destination`, `@turf/boolean-intersects`, `@react-native-async-storage/async-storage`.
- **Lưu trữ**: PostgreSQL 16 (`cropvision-db`), Local Disk Uploads / MinIO S3 interface.
- **Mục tiêu hiệu năng**: Payload JSON `/api/inference/analyze` giảm > 95% (< 5KB thay vì 14MB); tắt server an toàn < 2s; 100% test suites pass.
- **Ràng buộc**: Bán kính tác động tối thiểu (Rule 2.13); bảo toàn 100% logic nghiệp vụ hiện có; không phá vỡ route contracts.

## Constitution & Antigravity Rules Check
- [x] **Rule 2.1 (Modular File Sizing & SRP)**: Các module mới (`storageAdapter.js`, `env.js`, `offlineSyncManager.js`) đều dưới 150 dòng.
- [x] **Rule 2.6 (Explicit Approval Invariant)**: Đã được phê duyệt thông qua review policy tự động.
- [x] **Rule 2.7 (Trade-Off Analysis)**: Đã hoàn tất phân tích trade-off 5 chiều.
- [x] **Rule 2.8 (Spec-First Progressive Gating)**: Đã hoàn tất specify và clarify trước khi lập plan.
- [x] **Rule 2.11 (12-Factor App Fail-Fast)**: Đạt chuẩn Factor III, VI, VIII, IX, XI.
- [x] **Rule 2.13 (Minimal Change Principle)**: Refactor phẫu thuật, delta tối thiểu, zero speculative abstractions.

## Target Source Code Changes

### Component 1: 12-Factor Config & Graceful Shutdown (Factor III & IX)
- [NEW] `backend/src/config/env.js`: Module kiểm tra và trích xuất cấu hình fail-fast có kiểm tra kiểu/sự tồn tại.
- [MODIFY] `backend/server.js`: Tích hợp `SIGTERM` / `SIGINT` handler đóng kết nối Express và `pool.end()` an toàn.

### Component 2: 12-Factor Stateless Storage Adapter (Factor VI)
- [NEW] `backend/src/services/storageAdapter.js`: Interface `StorageAdapter` với `LocalStorageAdapter` và chuẩn bị cho `S3StorageAdapter`.
- [MODIFY] `backend/src/services/inferenceService.js`: Sử dụng `storageAdapter.save()` thay vì ghi trực tiếp vào `fs`.

### Component 3: Zero Heavy Payload Passthrough (Rule 1.2.1)
- [MODIFY] `ai_core/api/predict.py`: Bỏ bước mã hóa `image_base64`, chỉ trả về `boxes`, `filename`, `image_width`, `image_height`.
- [MODIFY] `backend/src/controllers/inferenceController.js`: Bỏ trường `image_base64` trong JSON response, chỉ trả về metadata và URL ảnh.
- [MODIFY] `App/app/(agrivision)/diagnosis-result.js`: Đọc ảnh trực tiếp từ URI cục bộ của thiết bị, fallback sang `imageUrl` từ server nếu ảnh từ history.

### Component 4: Concurrency & Spatial Optimization (Factor VIII)
- [MODIFY] `backend/src/controllers/epidemicController.js`: Bổ sung bộ lọc tọa độ Bounding Box ở câu lệnh SQL trước khi nạp vào `scanZonesInDanger`.

### Component 5: Mobile Offline-First Resilience (Rule 1.1.3)
- [NEW] `App/src/modules/@core/offline/offlineSyncManager.js`: Quản lý hàng đợi `PENDING_SAMPLES` và `PENDING_WALKS` qua `AsyncStorage`.
