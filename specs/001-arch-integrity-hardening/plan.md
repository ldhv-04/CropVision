# Implementation Plan: Architecture Integrity & Antigravity Governance Hardening

**Branch**: `001-arch-integrity-hardening` | **Date**: 2026-09-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-arch-integrity-hardening/spec.md`

## Summary
Triệt tiêu các khiếm khuyết kiến trúc cốt lõi được phát hiện qua `/understand` và bài test khó nhất bằng phương pháp Phục hồi Phẫu thuật Tối thiểu (Surgical Blast Radius Remediation - Rule 2.13). Khắc phục lỗi `server.js` thiếu xuất `module.exports = app`, sửa lỗi unhandled socket database teardown, hoàn thiện 100% kịch bản rollback (`down.sql`), đồng bộ hóa biến môi trường 12-Factor, và bọc giao dịch nguyên tử cho module dịch tễ để đưa tỷ lệ vượt qua kiểm thử backend lên 100%.

## Technical Context
- **Language/Version**: Node.js v22 (Express 5.2), Python 3.11 (FastAPI, YOLOv8).
- **Primary Dependencies**: `express`, `pg`, `@turf/helpers`, `@turf/destination`, `@turf/boolean-intersects`, `supertest`, `jest`.
- **Storage**: PostgreSQL 16 (Docker container `cropvision-db`).
- **Testing**: Jest 29/30, Supertest.
- **Target Platform**: Linux / Docker Compose, Local Developer Environment.
- **Project Type**: Web Service / Fullstack Tactical Field Station.
- **Performance Goals**: 100% test suites pass in < 5s; 0 unhandled socket exceptions on teardown.
- **Constraints**: Blast radius ≤ 6 source files; delta ≤ 80 LOC; strictly zero regressions in business logic.

## Constitution & Antigravity Rules Check
- [x] **Rule 2.1 (Modular File Sizing & SRP)**: Không thêm tệp nào > 300 dòng; mọi sửa đổi chỉ diễn ra cục bộ trong phạm vi hàm hiện có.
- [x] **Rule 2.3 (Reversible Migrations & Rollback)**: Bổ sung đủ 5 tệp `down.sql` tương ứng cho toàn bộ migrations hiện có trong `backend/initdb/`.
- [x] **Rule 2.4 (Direct Quality Verification)**: Đưa tỷ lệ pass test suite của backend từ 71.4% (5/7) lên 100% (7/7).
- [x] **Rule 2.6 (Explicit Approval Invariant)**: Được phê duyệt tự động thông qua chính sách đánh giá (Review Policy).
- [x] **Rule 2.7 (Trade-Off Analysis)**: Đã hoàn tất phân tích 5 chiều, lựa chọn Phương án A tối ưu.
- [x] **Rule 2.8 (Spec-First Progressive Gating)**: Đã hoàn thành specify và clarify trước khi lập plan.
- [x] **Rule 2.9 (Anti-Blind-Guessing Debugging)**: Đã kiểm chứng 100% nguyên nhân gốc rễ qua đo lường thực nghiệm.
- [x] **Rule 2.11 (12-Factor App Fail-Fast)**: Đồng bộ biến môi trường `DB_*` và `POSTGRES_*`, bảo đảm fail-fast tường minh.
- [x] **Rule 2.13 (Minimal Change Principle)**: Triệt tiêu YAGNI; không refactor ồ ạt; delta tối thiểu.

## Target Source Code Changes

### Component: Backend Lifecycle & Ingress
- [MODIFY] `backend/server.js`:
  - Xuất `module.exports = app;`
  - Bọc `startServer()` bằng `if (require.main === module)` để không tự kích hoạt port 3000 khi Jest `require()`
  - Xuất hàm `startServer` để các công cụ kiểm thử hoặc script khởi động có thể kiểm soát vòng đời.
- [MODIFY] `backend/src/config/db.js`:
  - Đọc biến môi trường hỗ trợ cả `DB_*` và fallback `POSTGRES_*` từ root `.env`.
  - Loại bỏ lệnh `process.exit(-1)` cưỡng bức tại event listener `pool.on('error')` để tránh crash ứng dụng khi mất kết nối tạm thời; thay bằng logging cảnh báo và giữ kết nối phục hồi.

### Component: Database Migrations & Rollback (Rule 2.3)
- [NEW] `backend/initdb/001-init.down.sql`: Hủy bỏ các bảng `users`, `crop_samples`, `inference_results`.
- [NEW] `backend/initdb/002-chat.down.sql`: Hủy bỏ `chat_sessions`, `chat_messages`.
- [NEW] `backend/initdb/003-diseases.down.sql`: Hủy bỏ `crop_diseases`, `treatment_methods`, `pesticides`, `pesticide_disease_map`.
- [NEW] `backend/initdb/005-geo-epidemic.down.sql`: Hủy bỏ `fields`, `sub_zones`, `zone_metrics`, `disease_reports`, `zone_alerts`.
- [NEW] `backend/initdb/006-field-redesign.down.sql`: Hủy bỏ `field_zone_maps`, `zone_health_history`.

### Component: Domain Logic & Transaction Atomicity (Rule 1.4 & Rule 2.10)
- [MODIFY] `backend/src/controllers/epidemicController.js`:
  - Bọc khối logic `INSERT INTO disease_reports`, `UPDATE sub_zones`, `INSERT INTO zone_alerts` trong Database Transaction (`BEGIN ... COMMIT / ROLLBACK`) với `client = await pool.connect()`.

### Component: Test Teardown & Hardest Test Remediation
- [MODIFY] `backend/tests/fieldRedesign.test.js`:
  - Đảm bảo `afterAll(async () => { await pool.end(); })` để giải phóng kết nối database hoàn toàn, chấm dứt lỗi `pgPass is not a function`.
- [MODIFY] `backend/tests/homepage.test.js`:
  - Đảm bảo đóng kết nối pool tương tự để test suite hoàn tất sạch sẽ.
