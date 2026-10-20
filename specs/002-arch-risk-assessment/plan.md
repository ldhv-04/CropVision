# Implementation Plan: Architectural Risk Assessment & Strategic Mitigation Roadmap

**Branch**: `002-arch-risk-assessment` | **Date**: 2026-09-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-arch-risk-assessment/spec.md`

## Summary
Kế hoạch hành động chiến lược nhằm giải quyết các rủi ro kiến trúc tiềm ẩn đã được xác định qua báo cáo khảo sát `/understand` và bộ quy chuẩn Antigravity. Tuân thủ nghiêm ngặt chỉ thị: **Không sửa đổi bất kỳ đoạn mã nguồn thực thi nào** trong giai đoạn khảo sát này; tập trung vào việc định hình kiến trúc mục tiêu, thiết lập tài liệu kỹ thuật và xây dựng lộ trình nâng cấp phân kỳ (Phased Roadmap) theo Nguyên lý Thay đổi Tối thiểu (Rule 2.13).

## Technical Context
- **Hệ thống đánh giá**: CropVision AI (Mobile Expo React Native, Station Web/Desktop MapLibre GL, Backend Express 5.2, AI Core YOLOv8 FastAPI, PostgreSQL 16).
- **Bộ quy chuẩn đối chiếu**: 6-Tier Architecture Rules, Antigravity Rules 2.1 - 2.13.
- **Ràng buộc tuyệt đối**: Zero Code Modification trong tác vụ này.

## Phased Mitigation Roadmap (Lộ trình Nâng cấp Khuyến nghị)

### Giai đoạn 1: Triệt tiêu Lãng phí Tài nguyên & Rủi ro Tràn Bộ nhớ (Minimal Delta)
- [ ] Loại bỏ trường `image_base64` trong phản hồi của `/api/inference/analyze` (tiết kiệm 40% RAM Node/Python, 30% băng thông di động).
- [ ] Thiết lập chính sách dọn dẹp hoặc giới hạn vòng đời tệp tin ảnh trong `backend/uploads/`.
- [ ] Bổ sung cơ chế xử lý ngoại tuyến cơ bản (`AsyncStorage` queue) cho Mobile App khi mất kết nối mạng.

### Giai đoạn 2: Tối ưu Hóa Không gian & Bền vững Dữ liệu (Medium Priority)
- [ ] Kích hoạt extension PostGIS trong PostgreSQL và tạo chỉ mục không gian GIST trên cột ranh giới.
- [ ] Giảm tải phép tính giao cắt không gian từ Node.js RAM sang câu truy vấn PostGIS `ST_Intersects` / `ST_DWithin`.
- [ ] Bổ sung Idempotency Key cho các API tạo báo cáo dịch bệnh và phân tích mẫu vật.

### Giai đoạn 3: Tái cấu trúc Mô-đun & Phân rã Tệp Lớn (Technical Debt Paydown)
- [ ] Tách nhỏ 34 tệp vượt trần 300 dòng theo Rule 2.1, đặc biệt là các màn hình GIS MapLibre Web (`StationMapCanvasMapLibre.web.jsx` 1,084 dòng).
- [ ] Từng bước áp dụng TypeScript và runtime schema validation (Zod) cho các hợp đồng API chính.
