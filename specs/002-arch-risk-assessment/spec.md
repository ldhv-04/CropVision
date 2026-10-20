# Feature Specification: Architectural Risk Assessment, Pros & Cons Audit

**Feature Branch**: `002-arch-risk-assessment`  
**Created**: 2026-09-12  
**Status**: Draft (Gated at /speckit-specify - Awaiting User Idea Lock-In)  
**Input**: User description: "/speckit-specify TÌm ra và báo cáo về các rủi rõ tiềm ẩn dựa theo các quy tắc thiết kế kiến trúc chung đã lưu vào trong ai agent, các ưu điểm nhược điểm của phần mềm và kiến trúc của phần mềm này. Sử dụng /understand , đảm bảo ràng buộc, quy tắc. Không sửa đổi bất cứ đoạn mã nguồn"

---

## 1. Mục tiêu & Bối cảnh Khảo sát

Yêu cầu thực hiện một cuộc kiểm toán kiến trúc toàn diện và độc lập cho hệ thống CropVision AI (bao gồm Mobile App, Station Admin Web/Desktop, Backend Express, AI Core YOLOv8, và Cơ sở dữ liệu PostgreSQL).
Cuộc kiểm toán dựa trên:
1. **Dữ liệu Đồ thị Tri thức `/understand`**: 841 nodes, 946 edges, 9 lớp kiến trúc từ `.ua/knowledge-graph.json`.
2. **Bộ Quy chuẩn Thiết kế Kiến trúc Chung lưu trong AI Agent**:
   - Kiến trúc 6 phân tầng chuẩn (Client Workstation, Ingress/Gateway, Microservices Control Plane, Event Broker, Async Worker, Persistence Storage).
   - Bộ quy tắc Clean Code & Agent Governance (Rule 2.1 đến 2.13).
3. **Ràng buộc Tuyệt đối**: **KHÔNG sửa đổi bất kỳ đoạn mã nguồn thực thi nào** trong quá trình thực hiện đặc tả này.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Kiểm toán Rủi ro Tiềm ẩn theo Bộ Quy tắc 6 Phân tầng (Priority: P1)
Là Kiến trúc sư Hệ thống (Chief Architect), tôi cần một báo cáo đối chiếu chi tiết giữa kiến trúc hiện hữu của CropVision với các Invariants cốt lõi của bộ quy tắc Antigravity để xác định những điểm nghẽn, lỗ hổng bảo mật và rủi ro sụp đổ khi chịu tải lớn.

- **Why this priority**: Giúp đội ngũ kỹ thuật nhìn thấy trước các "điểm mù" kỹ thuật (technical blindspots) trước khi triển khai hệ thống cho các vùng chuyên canh quy mô lớn.
- **Independent Test**: Báo cáo phân tích đối chiếu 100% các điều luật trong 6 phân tầng và đánh giá mức độ vi phạm/tuân thủ kèm theo bằng chứng mã nguồn cụ thể.
- **Acceptance Scenarios**:
  1. **Given** kiến trúc CropVision hiện tại, **When** đối chiếu với Tier 1 (Client) đến Tier 6 (Storage), **Then** làm rõ các vi phạm về Thread Isolation, Payload Passthrough, Thiếu Message Broker, và Thiếu PostGIS.
  2. **Given** các vi phạm được phát hiện, **When** phân tích tác động rủi ro, **Then** định lượng được hậu quả (hết RAM, tắc nghẽn Event Loop, mất dữ liệu khi offline).

---

### User Story 2 - Đánh giá Đa chiều Ưu - Nhược điểm của Phần mềm (Priority: P2)
Là Giám đốc Sản phẩm (Product Manager), tôi cần hiểu rõ những điểm mạnh vượt trội (Pros) cần phát huy và những hạn chế cố hữu (Cons) của kiến trúc phần mềm này so với định vị sản phẩm "Tactical Agronomy Command Terminal".

- **Why this priority**: Cung cấp bức tranh toàn cảnh để cân đối giữa tính năng người dùng, hiệu năng phần cứng và chi phí hạ tầng.
- **Independent Test**: Bảng phân tích SWOT/Pros-Cons chi tiết cho từng cấu phần: Mobile App (Expo), Station Web (MapLibre), Backend API (Express), AI Engine (YOLOv8), Database (Postgres).
- **Acceptance Scenarios**:
  1. **Given** tài liệu `PRODUCT.md`, **When** đánh giá giao diện và tính tương tác, **Then** nêu bật ưu điểm của WebGL GIS MapLibre và định vị Tactical Tool.
  2. **Given** điều kiện thực địa nông thôn, **When** đánh giá trải nghiệm thực tế, **Then** chỉ ra nhược điểm chí mạng về việc thiếu vắng Local-First / Offline Mode.

---

### User Story 3 - Lộ trình Tối ưu Hóa Dựa trên Minimal Change Principle (Priority: P3)
Là Trưởng nhóm Kỹ thuật (Lead Engineer), tôi cần các khuyến nghị khắc phục rủi ro được phân kỳ theo thứ tự ưu tiên, tuân thủ nguyên lý Thay đổi Tối thiểu (Rule 2.13), không overengineering và không làm gián đoạn hệ thống.

- **Why this priority**: Đảm bảo đội ngũ không rơi vào bẫy "đập đi xây lại" tốn kém mà xử lý đúng các mắt xích yếu nhất.
- **Independent Test**: Lập bảng đánh giá trade-off 5 chiều (Tài nguyên, Độ phức tạp, Tính ổn định, Khả năng mở rộng, Tính bảo trì) cho từng khuyến nghị.
- **Acceptance Scenarios**:
  1. **Given** các rủi ro được phân loại, **When** đề xuất giải pháp, **Then** mỗi giải pháp đều có phân tích chi phí/lợi ích và phương án đơn giản nhất có thể áp dụng.

---

## 3. Requirements *(mandatory)*

### 3.1 Functional Requirements
- **FR-001**: Báo cáo PHẢI trích xuất và tham chiếu dữ liệu từ Đồ thị Tri thức `/understand` (`.ua/knowledge-graph.json`), bao gồm 9 lớp kiến trúc và các liên kết phụ thuộc chính.
- **FR-002**: Báo cáo PHẢI đánh giá hệ thống dựa trên 6 Phân tầng Kiến trúc Antigravity (Client Workstation, Ingress, Control Plane, Broker, Async Worker, Persistence).
- **FR-003**: Báo cáo PHẢI đánh giá hệ thống dựa trên các quy chuẩn Clean Code & Invariants (Rule 2.1: File Sizing, Rule 2.2: Strict Typing, Rule 2.10: Clean Architecture, Rule 2.11: 12-Factor, Rule 2.13: Minimal Change).
- **FR-004**: Báo cáo PHẢI chỉ rõ ít nhất 5 ưu điểm nổi bật và 5 nhược điểm cốt lõi của phần mềm CropVision.
- **FR-005**: Báo cáo PHẢI phân tích cụ thể rủi ro thực địa (Field Operational Risks) như: Mất kết nối internet ngoài đồng, thiết bị di động yếu, camera chụp ảnh mờ/nhiễu.
- **FR-006**: Báo cáo PHẢI thực hiện đánh giá Trade-Off 5 Chiều (Rule 2.7) cho các định hướng kiến trúc tương lai.
- **FR-007**: Tuyệt đối **KHÔNG** chỉnh sửa, thêm mới, hoặc xóa bất kỳ file mã nguồn thực thi nào (`.js`, `.jsx`, `.py`, `.sql`) trong repository.

---

## 4. Success Criteria *(mandatory)*

- **SC-001**: 100% các phân tầng kiến trúc từ Client đến Database được kiểm toán và chấm điểm rủi ro.
- **SC-002**: Chỉ rõ các bằng chứng mã nguồn cụ thể (tên tệp, hàm, dòng lệnh) chứng minh cho từng rủi ro mà không dựa trên suy đoán mù.
- **SC-003**: Toàn bộ báo cáo được trình bày trực quan, có biểu đồ phân cấp, bảng phân tích và liên kết tệp tin có thể nhấp chuột.
- **SC-004**: Đảm bảo 0 file mã nguồn thực thi bị thay đổi trong suốt quá trình thực hiện task (`git status -s` chỉ ghi nhận tài liệu spec/report).

---

## 5. Assumptions & Constraints
1. Hệ thống đang chạy ổn định sau đợt hardening phẫu thuật trước đó (7/7 test suites backend pass).
2. Không thực hiện code modifications; mục tiêu duy nhất là phân tích, kiểm toán và báo cáo chiến lược.
