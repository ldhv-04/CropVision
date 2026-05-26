# Feature Specification: CropVision Phase 1 Dual-Platform

**Feature Branch**: `phase-1-dual-platform`

**Created**: 2026-05-25

**Status**: Approved

**Input**: User description: "CropVision Phase 1 dual-platform architecture (CropVision Station for web, AgriVision for mobile). Includes Weather API, Field Management, Drone-ready Database, Context-Aware AI Recommendation (Agrio-style). Station UI uses CSS Grid Dark Mode, AgriVision uses Bottom Tabs+Drawer Light Mode."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Field Management (Priority: P1)

Là một nông dân (Farmer), tôi muốn đăng ký và quản lý các cánh đồng của mình (bao gồm Tên, Loại cây, Diện tích, Tọa độ GPS) thông qua ứng dụng AgriVision để tôi có thể theo dõi tình trạng sức khỏe cây trồng theo từng khu vực cụ thể.

**Why this priority**: Cánh đồng là đơn vị quản lý cốt lõi. Không có cánh đồng, không thể phân tích thời tiết hay gán kết quả nhận diện bệnh vào một khu vực thực tế. Đây là nền tảng cho mọi tính năng B2G và phân tích sau này.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập vào AgriVision, vào mục "My Fields", tạo mới một cánh đồng với tọa độ GPS lấy tự động từ thiết bị và xem cánh đồng đó hiện trên danh sách.

**Acceptance Scenarios**:

1. **Given** Nông dân đang ở màn hình Dashboard, **When** nhấn "Add Field", **Then** hệ thống yêu cầu quyền Location, tự động điền GPS và cho phép nhập Tên/Loại cây.
2. **Given** Một nông dân có 3 cánh đồng, **When** họ mở mục "My Fields", **Then** hệ thống hiển thị danh sách 3 cánh đồng kèm theo loại cây và diện tích tương ứng.

---

### User Story 2 - Context-Aware AI Disease Recommendation (Priority: P1)

Là một nông dân, khi tôi chụp ảnh một lá cây bị bệnh, tôi muốn AI (Gemini) gợi ý phương pháp điều trị và loại thuốc không chỉ dựa trên loại bệnh mà còn kết hợp với thông tin thời tiết hiện tại và loại cây trồng (như Agrio), để tôi có phương án xử lý hiệu quả và chính xác nhất với tình hình thực tế.

**Why this priority**: Đây là core value lớn nhất của ứng dụng. Tính năng này tạo ra sự khác biệt hoàn toàn so với các ứng dụng tra cứu thuốc thông thường, biến CropVision thành một chuyên gia nông nghiệp thực thụ.

**Independent Test**: Test độc lập bằng cách chụp 1 ảnh bị "Bệnh đạo ôn", với hệ thống đang mock thời tiết là "Mưa to, độ ẩm 95%". AI phải trả về kết quả khuyến nghị dùng thuốc có độ bám dính cao.

**Acceptance Scenarios**:

1. **Given** Kết quả nhận diện là "Đạo Ôn" trên lúa và thời tiết có mưa lớn, **When** người dùng hỏi AI "Tôi nên dùng thuốc gì?", **Then** AI khuyến cáo các loại thuốc nội hấp hoặc có tính bám dính tốt để không bị rửa trôi.
2. **Given** Nông dân đang xem kết quả của cánh đồng A, **When** họ bấm tư vấn, **Then** AI tự động lấy chính xác GPS của cánh đồng A để fetch thời tiết, không bắt user phải nhập lại vị trí.

---

### User Story 3 - Observer Command Center (Priority: P2)

Là một cán bộ phân tích/Chi cục BVTV (Admin/Analyst), tôi muốn có một Dashboard tổng quan (CropVision Station) hiển thị tất cả các chỉ số trên giao diện CSS Grid chuyên nghiệp, hỗ trợ Dark Mode, để tôi có thể theo dõi và giám sát dịch bệnh toàn vùng.

**Why this priority**: Đây là nền tảng của triết lý B2G / Hub-and-Spoke. Dù Phase 1 chưa có Heatmap phức tạp, việc tách biệt được UI/UX của Station là tiền đề bắt buộc.

**Independent Test**: Đăng nhập bằng tài khoản Admin, hệ thống tự động redirect sang `/station` với giao diện Desktop CSS Grid Dark Mode thay vì UI Mobile của nông dân.

**Acceptance Scenarios**:

1. **Given** Người dùng là Admin, **When** họ đăng nhập thành công, **Then** hệ thống điều hướng vào URL `(station)` với giao diện Grid tối màu.
2. **Given** Người dùng là Nông dân, **When** họ cố truy cập URL `/station`, **Then** hệ thống chặn và redirect về màn hình AgriVision.

---

### User Story 4 - Future Drone Integration Preparation (Priority: P3)

Là một nhà phát triển hệ thống, tôi muốn cơ sở dữ liệu lưu trữ lịch sử nhận diện (`crop_samples`) hỗ trợ phân biệt nguồn ảnh (từ Mobile, từ Drone, hoặc từ Station) và hỗ trợ gom nhóm (`batch_id`) để chuẩn bị cho kiến trúc xử lý ảnh hàng loạt từ Drone trong tương lai.

**Why this priority**: Đón đầu tính năng tương lai để tránh phải migration lớn và phá vỡ cấu trúc DB sau này.

**Independent Test**: Test backend bằng cách gọi API `/api/inference/analyze` với payload chứa `source_type=drone` và `batch_id=uuid`. Database lưu đúng dữ liệu.

**Acceptance Scenarios**:

1. **Given** Client gửi ảnh với payload có `source_type="drone"`, **When** lưu vào DB, **Then** field `source_type` được gán là `drone` và không bị lỗi.

### Edge Cases

- What happens when [OpenWeatherMap API limit is reached]? Hệ thống sẽ sử dụng fallback data (Dữ liệu cache trong DB) hoặc fallback về tư vấn không có thời tiết.
- How does system handle [User denies Location Permission]? Chức năng tạo Field sẽ yêu cầu user nhập chay (nhập text vị trí) hoặc báo lỗi không thể lấy GPS tự động.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST điều hướng người dùng dựa trên Role (admin -> Station, user -> AgriVision).
- **FR-002**: System MUST tích hợp OpenWeatherMap API và có cơ chế cache (lưu trữ tạm thời) trong CSDL để tối ưu requests.
- **FR-003**: System MUST cho phép nông dân (AgriVision) CRUD (Tạo, Xem, Sửa, Xóa) thông tin các cánh đồng của họ.
- **FR-004**: System MUST inject ngữ cảnh (Field Info + Weather Info) vào System Prompt của Gemini trong module ChatService.
- **FR-005**: System MUST hỗ trợ Dynamic Theming: Station mặc định Dark Mode, AgriVision mặc định Light Mode, nhưng cho phép User thay đổi.
- **FR-006**: System MUST thiết kế schema DB hỗ trợ `source_type` và `batch_id` ở bảng `crop_samples`.

### Key Entities *(include if feature involves data)*

- **[Field]**: Đại diện cho cánh đồng của nông dân. Thuộc tính: id, user_id, name, crop_type, area, lat, lon.
- **[Weather_Cache]**: Lưu trữ kết quả thời tiết theo tọa độ. Thuộc tính: lat, lon, data, cached_at.
- **[Crop_Sample]**: Mẫu nhận diện. Cập nhật thêm quan hệ `field_id`, thuộc tính `source_type`, `batch_id`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% Admin đăng nhập được điều hướng sang giao diện Station Grid.
- **SC-002**: 100% Nông dân đăng nhập được điều hướng sang AgriVision Bottom Tabs+Drawer.
- **SC-003**: Responses của Gemini Chat nhắc đến/phụ thuộc vào tình trạng thời tiết (mưa, nắng, độ ẩm) khi user yêu cầu đề xuất thuốc trong >90% trường hợp test.
- **SC-004**: Database Schema mới (`fields`, `weather_cache`) và updates trên `crop_samples` được deploy thành công không gây lỗi hệ thống hiện tại.

## Assumptions

- OpenWeatherMap Free Tier (1000 calls/day) là đủ cho môi trường Development/Khóa luận. Cơ chế cache sẽ giảm tải tối đa.
- User (Nông dân) có kết nối mạng ổn định khi dùng tính năng Chat/AI. Tính năng Offline hoàn toàn sẽ đưa vào Phase 3.
- Database đang sử dụng là PostgreSQL, hỗ trợ các kiểu JSONB cho `weather_cache` và các index trên tọa độ.
