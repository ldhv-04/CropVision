# CropVision AI

Hệ thống phát hiện bệnh lá cây dựa trên YOLOv8, gồm 3 thành phần vận hành tách biệt:

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| `App/` | Expo + React Native Web + Electron | Giao diện desktop/web |
| `backend/` | Node.js + Express + PostgreSQL | API, xác thực, admin, lịch sử |
| `ai_core/` | FastAPI + YOLOv8 (Ultralytics) | Dịch vụ suy luận AI |

---

## Cấu trúc repository

```
cropvision_db/
├── App/                  # Frontend desktop/web
│   ├── src/
│   │   ├── components/   # AdminPanel, SampleDetailModal
│   │   ├── config/       # api.js - cấu hình URL động
│   │   ├── constants/    # theme.js
│   │   ├── context/      # AuthContext.js - quản lý phiên đăng nhập
│   │   ├── navigation/   # AppNavigator.js - trung tâm điều hướng
│   │   └── screens/      # Login, Register, VerifyEmail, Welcome, MainDashBoard, SampleList
│   ├── electron/         # main.js - Electron entry point
│   └── App.js            # Shell khởi động, giao quyền cho AppNavigator
│
├── backend/
│   └── src/
│       ├── config/       # db.js - PostgreSQL pool
│       ├── controllers/  # HTTP handlers mỏng (auth, inference, admin)
│       ├── middleware/   # authMiddleware.js - JWT, RBAC
│       ├── models/       # Data layer - truy vấn DB thuần túy
│       ├── routes/       # Express routers + validation middleware
│       ├── services/     # Business logic (authService, inferenceService, adminService)
│       └── utils/        # mailService.js (Resend OTP)
│
├── ai_core/
│   ├── api/              # predict.py - FastAPI router
│   ├── core/             # config.py - cấu hình từ env
│   ├── models/           # yolo_model.py - YOLO singleton loader
│   ├── schemas/          # prediction.py - Pydantic schemas
│   ├── main.py           # Entry point FastAPI + uvicorn
│   ├── Dockerfile        # Container image cho ai_core
│   └── requirements.txt
│
├── docker-compose.yml    # Orchestration: db + backend + ai_core
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

### 3. Frontend desktop/web

```powershell
cd App
npm install
npm run dev:desktop      # Mở Electron window
# hoặc
npm run dev              # Mở trong trình duyệt
```

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
