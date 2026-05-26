# Implementation Plan: CropVision Phase 1 Dual-Platform

**Branch**: `phase-1-dual-platform` | **Date**: 2026-05-25 | **Spec**: [specs/phase-1-dual-platform/spec.md](file:///f:/Documents/Khoa%20Luan%202026/cropvision_db/specs/phase-1-dual-platform/spec.md)

**Input**: Feature specification from `/specs/phase-1-dual-platform/spec.md`

## Summary

Triển khai cấu trúc dự án kép (Dual-Platform) cho CropVision bao gồm Station (cho Admin/Analyst) và AgriVision (cho Nông dân). Tích hợp dữ liệu thời tiết (OpenWeatherMap) và quản lý cánh đồng (Field Management) làm dữ liệu nền để nâng cấp engine gợi ý AI (Gemini) thành hệ thống tư vấn thông minh bối cảnh (Agrio-style). Thiết lập schema CSDL sẵn sàng cho xử lý hàng loạt ảnh từ Drone.

## Technical Context

**Language/Version**: JavaScript (Node.js 18+ cho Backend, Expo SDK 55 cho Frontend App).

**Primary Dependencies**: 
- Backend: Express.js, `pg` (PostgreSQL), `axios` (gọi OpenWeatherMap), `@google/genai` (Gemini API).
- Frontend: Expo Router, NativeWind (hoặc TailwindCSS), Zustand (quản lý state).

**Storage**: PostgreSQL (DB_NAME: `cropvision_db`).

**Testing**: 
- Jest cho Backend APIs.
- Kiểm tra thủ công UI/UX trên Expo Go / Web Browser.

**Target Platform**: 
- AgriVision: Android APK (Mobile-first).
- CropVision Station: Web Browser / Desktop.

**Project Type**: Web Application + Mobile App (Monorepo with Expo Router) + Node.js API Backend.

**Performance Goals**: API response time < 500ms (Sử dụng weather_cache để tránh latency gọi API OpenWeatherMap liên tục).

**Constraints**: Free tier OpenWeatherMap (1000 calls/day), nên cache weather data tối thiểu 15-30 phút/lần theo tọa độ (làm tròn lat/lon).

**Scale/Scope**: Phase 1 tập trung hoàn thiện core workflow của 2 personas (Admin/Farmer), kết hợp API thời tiết và AI. Mức độ ứng dụng: Development/Khóa luận.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Immutability: Đảm bảo dữ liệu crop_samples không bị ghi đè, thêm log `created_at`.
- [x] Security: API Weather Key cấu hình trong `.env`, không hardcode vào mã nguồn.

## Project Structure

### Documentation (this feature)

```text
specs/phase-1-dual-platform/
├── plan.md              # This file
├── spec.md              # Phase 0 output
```

### Source Code (repository root)

```text
backend/
├── initdb/
│   ├── 001-init.sql          # (Modified) Add field_id, source_type, batch_id
│   └── 004-fields.sql        # (New) fields and weather_cache tables
├── src/
│   ├── controllers/
│   │   ├── fieldController.js    # (New)
│   │   ├── weatherController.js  # (New)
│   │   └── inferenceController.js# (Modified)
│   ├── routes/
│   │   ├── fieldRoutes.js        # (New)
│   │   └── weatherRoutes.js      # (New)
│   └── services/
│       ├── chatService.js        # (Modified) Inject context (Field + Weather)
│       └── weatherService.js     # (New) OpenWeatherMap integration
└── .env                      # (Modified) Add OPENWEATHERMAP_API_KEY

App/
├── src/
│   ├── app/
│   │   ├── _layout.js            # (Modified) Role-based routing logic
│   │   ├── (agrivision)/         # (New) Farmer mobile UI (Drawer + Tabs)
│   │   │   ├── _layout.js
│   │   │   └── index.js          
│   │   └── (station)/            # (New) Admin web UI (CSS Grid Dark Mode)
│   │       ├── _layout.js
│   │       └── index.js
```

**Structure Decision**: Giữ nguyên kiến trúc Monorepo hiện tại. Backend xử lý API và Database. Frontend App chia Layout theo Role-based Navigation dựa trên tính năng của Expo Router.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Thêm `batch_id` và `source_type` vào CSDL | Đón đầu kiến trúc Drone (Asynchronous Bulk Processing) | Bỏ qua sẽ khiến việc migrate dữ liệu ở Phase 4 cực kỳ rủi ro và phá vỡ cấu trúc foreign keys của hệ thống. |
| Role-based file routing trong cùng 1 Expo App | Tái sử dụng Code (auth, API services) | Tách thành 2 app (1 ReactJS cho web, 1 Expo cho mobile) sẽ làm tăng gấp đôi nỗ lực bảo trì codebase. Expo Router đáp ứng tốt cả Web và Mobile. |
