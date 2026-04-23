# CropVision AI

Hệ thống phát hiện bệnh lá cây dựa trên YOLOv8, gồm 3 thành phần vận hành tách biệt theo mô hình Tri-Platform Modular Architecture:

```mermaid
graph TD
    User((User))
    Web[Web Browser]
    Desktop[Electron App]
    Mobile[Expo Go/Native]
    
    subgraph Frontend [App Module - Expo Router]
        UI[Modular UI src/modules]
        Core[@core Design & Stores]
        Platform[Platform Services]
    end
    
    subgraph Services
        Backend[Backend API Node.js]
        AICore[AI Core Python/YOLOv8]
        DB[(PostgreSQL)]
    end

    User --> Web
    User --> Desktop
    User --> Mobile
    Web & Desktop & Mobile --> UI
    UI --> Core
    UI --> Platform
    Core --> Backend
    Backend --> DB
    Backend --> AICore
```

---

## Cấu trúc tổng quan
| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| `App/` | Expo SDK 55 + Router | Web/Android/iOS/Desktop |
| `backend/` | Node.js + PostgreSQL | Business Logic & Data |
| `ai_core/` | FastAPI + YOLOv8 | Computer Vision Discovery |

---

## Cấu trúc repository

```
cropvision_db/
├── App/                  # Frontend tri-platform (Web, Desktop, Mobile)
│   ├── app/              # Expo Router (File-based Routing)
│   │   ├── (auth)/       # Luồng xác thực (Welcome, Login, Register, Verify)
│   │   ├── (main)/       # Luồng chính (Inference, History, Admin)
│   │   └── _layout.js    # Root Layout & Global State provider
│   ├── src/
│   │   ├── modules/      # Three-Layer Module Pattern (Core, Adaptive, Feature)
│   │   │   ├── @core/    # Design tokens, global stores (Zustand), AppShell
│   │   │   ├── platform/ # Adaptive UI services (ImagePickerService)
│   │   │   ├── auth/     # Auth store logic
│   │   │   ├── inference/# Inference module (stores, layout, actions)
│   │   │   ├── history/  # History module (SampleList)
│   │   │   └── admin/    # Admin module (User management, system stats)
│   │   └── ...           # legacy src/ screens & navigation (phasing out)
│   ├── electron/         # Electron platform host config
│   └── dist/             # Production web bundle (for Vercel/Electron)
│
├── backend/              # Node.js API Service
│   └── src/
│       ├── controllers/  # Request handlers
│       ├── middleware/   # JWT, RBAC, Validation
│       ├── models/       # PostgreSQL Data Access Object (pure SQL)
│       ├── routes/       # Express Route definitions
│       ├── services/     # Business logic layer
│       └── server.js     # Entry point Node.js
│
├── ai_core/              # Python AI Discovery Service
│   ├── api/              # FastAPI routers
│   ├── core/             # AI configuration (YOLO paths)
│   ├── main.py           # Entry point uvicorn server
│   └── Dockerfile        # Container source
│
├── docker-compose.yml    # Orchestration (DB + Backend + AI)
└── README.md
```

---

## Yêu cầu môi trường

| Phần mềm | Phiên bản tối thiểu |
|----------|---------------------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.10+ |
| PostgreSQL | 14+ |
| Docker Desktop | 4+ (khuyến nghị) |

---

## Chạy bằng Docker (khuyến nghị)

Docker khởi động `db`, `backend`, và `ai_core`. Frontend (`App`) vẫn chạy ngoài Docker.

```powershell
# 1. Chuẩn bị file .env
copy .env.docker.example .env
# Điền JWT_SECRET, POSTGRES_PASSWORD, RESEND_API_KEY vào .env

# 2. Build và khởi động stack
docker compose up --build

# 3. Dừng stack
docker compose down

# Xóa sạch data local (volumes)
docker compose down -v
```

Sau khi stack lên:

| Dịch vụ | URL |
|---------|-----|
| Backend API | `http://127.0.0.1:3000/api/health` |
| AI Core | `http://127.0.0.1:8000/health` |
| PostgreSQL | `127.0.0.1:5432` |

---

## Khởi động thủ công (local dev)

### 1. Backend

```powershell
cd backend
copy .env.example .env   # Điền các biến bắt buộc
npm install
npm run dev              # Chạy với nodemon (hot reload)
```

### 2. AI Core

```powershell
cd ai_core
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py           # Khởi động FastAPI trên 127.0.0.1:8000
```

> **Lưu ý:** Phải chạy `python main.py` từ trong môi trường ảo (venv/conda) đã cài đủ `fastapi`, `ultralytics`, `uvicorn`.

### 3. Frontend (App)

| Lệnh | Mô tả |
|------|-------|
| `npm run dev:desktop` | (Khuyến nghị) Chạy Web + Electron Window |
| `npm run web` | Chỉ chạy phiên bản trình duyệt (port 8081) |
| `npm run android` / `ios` | Chạy trên thiết bị di động |
| `npm run export:web` | Tạo production bundle trong `dist/` |
| `npm test` | Chạy bộ kiểm thử Jest & E2E |

---

## Thứ tự khởi động khuyến nghị

```
1. PostgreSQL / docker compose up
2. backend  (npm run dev)
3. ai_core  (python main.py)
4. App      (npm run dev:desktop)
```

---

## Biến môi trường

### `backend/.env` (local dev)

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `PORT` | ✅ | Cổng backend (mặc định 3000) |
| `DB_USER` | ✅ | PostgreSQL user |
| `DB_PASSWORD` | ✅ | PostgreSQL password |
| `DB_HOST` | ✅ | Host DB (mặc định localhost) |
| `DB_PORT` | ✅ | Cổng DB (mặc định 5432) |
| `DB_NAME` | ✅ | Tên database |
| `JWT_SECRET` | ✅ **BẮT BUỘC** | Secret ký JWT — server từ chối khởi động nếu thiếu |
| `RESEND_API_KEY` | ⚠️ | API key Resend; thiếu thì đăng ký qua email sẽ thất bại |
| `ADMIN_EMAIL` | optional | Email admin mặc định |
| `ADMIN_PASSWORD` | optional | Mật khẩu admin mặc định |
| `ADMIN_FULL_NAME` | optional | Tên hiển thị admin |
| `AI_CORE_URL` | optional | URL AI Core (mặc định `http://127.0.0.1:8000`) |

> ⚠️ `JWT_SECRET` là **bắt buộc**. Backend sẽ throw lỗi và không khởi động được nếu biến này không được set.

Tạo JWT_SECRET mạnh:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### `App/.env`

| Biến | Mô tả |
|------|-------|
| `EXPO_PUBLIC_API_PROTOCOL` | `http` hoặc `https` |
| `EXPO_PUBLIC_API_HOST` | IP/hostname backend (dùng `127.0.0.1` khi chạy cùng máy) |
| `EXPO_PUBLIC_API_PORT` | Cổng backend (mặc định `3000`) |
| `EXPO_PUBLIC_API_ORIGIN` | Override toàn bộ (ưu tiên cao nhất) |

> Khi frontend và backend chạy cùng máy: đặt `EXPO_PUBLIC_API_HOST=127.0.0.1`  
> Khi frontend chạy trên máy khác trong LAN: đặt `EXPO_PUBLIC_API_HOST=<IP-máy-backend>`

### `.env` (root — chỉ dùng với Docker Compose)

| Biến | Bắt buộc |
|------|----------|
| `POSTGRES_DB` | ✅ |
| `POSTGRES_USER` | ✅ |
| `POSTGRES_PASSWORD` | ✅ |
| `POSTGRES_PORT` | ✅ |
| `BACKEND_PORT` | ✅ |
| `AI_CORE_PORT` | ✅ |
| `JWT_SECRET` | ✅ **BẮT BUỘC** |
| `RESEND_API_KEY` | optional |
| `ADMIN_FULL_NAME` | optional |
| `ADMIN_EMAIL` | optional |
| `ADMIN_PASSWORD` | optional |

---

## Tài khoản admin mặc định

Nếu không override, backend tự khởi tạo:

| Trường | Giá trị mặc định |
|--------|-----------------|
| Email | `admin@cropvision.local` |
| Mật khẩu | `Admin@123` |

> Nên đặt `ADMIN_PASSWORD` trong `.env` trước khi triển khai production.

---

## Giới hạn upload ảnh

| Giới hạn | Giá trị |
|----------|---------|
| Kích thước tối đa | 10 MB |
| Định dạng cho phép | JPEG, PNG, WebP, GIF |

Validation được áp dụng ở cả 2 lớp: **route (multer)** và **service layer**.

---

## Thư mục sinh ra khi chạy (không track git)

| Thư mục | Nội dung |
|---------|----------|
| `backend/uploads/` | Ảnh upload từ người dùng |
| `App/dist/` | Web bundle |
| `App/release/` | Electron desktop artifact |
| `ai_core/venv/` | Môi trường Python cục bộ |

---

## API Endpoints chính

| Method | Route | Mô tả | Auth |
|--------|-------|-------|------|
| `GET` | `/api/health` | Health check | — |
| `POST` | `/api/auth/register` | Đăng ký tài khoản | — |
| `POST` | `/api/auth/verify` | Xác thực OTP email | — |
| `POST` | `/api/auth/login` | Đăng nhập, nhận JWT | — |
| `POST` | `/api/inference/analyze` | Phân tích ảnh lá cây | JWT |
| `GET` | `/api/inference/samples` | Lịch sử phân tích | JWT |
| `GET` | `/api/admin/summary` | Dashboard admin | JWT + Admin |
| `DELETE` | `/api/admin/samples/:id` | Xóa mẫu vật | JWT + Admin |

---

## Ghi chú vận hành

- Kiểm tra backend bằng `GET /api/health` trước khi debug đăng nhập
- Nếu thay đổi schema AI Core, restart cả `ai_core` lẫn `backend`
- `POSTGRES_PASSWORD` trong root `.env` chỉ có hiệu lực khi volume `postgres_data` được tạo lần đầu. Nếu đổi password, chạy `docker compose down -v` trước
- OTP email cần `RESEND_API_KEY` hợp lệ; nếu để trống, đăng ký qua email sẽ thất bại nhưng backend vẫn khởi động được
- Không commit `.env`, `venv/`, `uploads/`, hoặc build artifacts
