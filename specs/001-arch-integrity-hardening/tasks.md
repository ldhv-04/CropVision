# Tasks: Architecture Integrity & Antigravity Governance Hardening

**Branch**: `001-arch-integrity-hardening` | **Date**: 2026-09-12 | **Plan**: [plan.md](plan.md)

## Tasks Breakdown

- [x] **Task 1: Chuẩn hóa 12-Factor DB Config & Loại bỏ Crash Cưỡng bức**
  - Path: `backend/src/config/db.js`, `backend/src/middleware/authMiddleware.js`
  - Kết quả: Đã bổ sung nạp biến môi trường từ root `.env`, hỗ trợ cả `DB_*` và `POSTGRES_*`. Đã loại bỏ `process.exit(-1)` cưỡng bức. Kết nối database kiểm tra thành công.

- [x] **Task 2: Sửa Cổng Kết nối & Vòng đời Khởi động Server**
  - Path: `backend/server.js`
  - Kết quả: Đã xuất `module.exports = app;` và `startServer`. Bọc `app.listen()` trong `if (require.main === module)` để server không tự chiếm cổng khi import kiểm thử.

- [x] **Task 3: Bổ sung 100% Kịch bản Rollback Database (Rule 2.3)**
  - Path: `backend/initdb/`
  - Kết quả: Đã tạo đủ 5 tệp `down.sql`:
    - `001-init.down.sql`
    - `002-chat.down.sql`
    - `003-diseases.down.sql`
    - `005-geo-epidemic.down.sql`
    - `006-field-redesign.down.sql`
  - Phủ 100% migrations với kịch bản rollback an toàn.

- [x] **Task 4: Bọc Giao dịch Nguyên tử (Transaction Atomicity) cho Module Dịch tễ**
  - Path: `backend/src/controllers/epidemicController.js`
  - Kết quả: Đã bọc các câu lệnh `INSERT INTO disease_reports`, `UPDATE sub_zones`, `INSERT INTO zone_alerts` trong `BEGIN ... COMMIT / ROLLBACK` với `client = await pool.connect()` và `finally { client.release() }`.

- [x] **Task 5: Khắc phục Vòng đời Teardown trong Bộ Kiểm thử Khó Nhất**
  - Path: `backend/tests/fieldRedesign.test.js`, `backend/tests/homepage.test.js`
  - Kết quả: Đã thêm `afterAll(async () => { await pool.end(); })` để giải phóng kết nối database pool, chấm dứt hoàn toàn lỗi socket rò rỉ và force-exit.

- [x] **Task 6: Kiểm chứng Toàn diện & Đo lường Kết quả**
  - Kết quả: 7/7 test suites PASS (100%), 57/57 tests PASS trong 1.25s. Bộ test khó nhất `tests/fieldRedesign.test.js` và `tests/homepage.test.js` hoàn thành xuất sắc.
