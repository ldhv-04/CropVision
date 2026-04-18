# Contributing Guide

Chao mung ban den voi CropVision AI. Tai lieu nay huong dan cach thiet lap moi truong phat trien, quy trinh dong gop va cac lenh thong dung.

<!-- AUTO-GENERATED: SCRIPTS -->
## Available Scripts

### Backend (`backend/package.json`)
| Command | Description |
|---------|-------------|
| `npm run test` | Run test suite (hien chua co test) |
| `npm run start` | Chay server production (`node server.js`) |
| `npm run dev` | Chay server development voi hot-reload (`nodemon`) |

### App (`App/package.json`)
| Command | Description |
|---------|-------------|
| `npm run start` | Khoi dong Expo server mac dinh |
| `npm run mobile` | Khoi dong Expo o che do LAN |
| `npm run mobile:tunnel`| Khoi dong Expo kem ngrok tunnel |
| `npm run android` | Khoi dong tren Android emulator |
| `npm run ios` | Khoi dong tren iOS simulator |
| `npm run web` | Khoi dong React Native Web |
| `npm run electron` | Khoi dong Electron window (can web dang chay) |
| `npm run dev:desktop` | Khoi dong song song Web va Electron |
| `npm run build:win` | Build ra ung dung .exe (NSIS) |
<!-- AUTO-GENERATED: SCRIPTS -->

<!-- AUTO-GENERATED: ENV -->
## Environment Variables (`backend/.env.example`)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Yes | Cổng lắng nghe API | `3000` |
| `DB_USER` | Yes | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | Yes | PostgreSQL password | `12345678` |
| `DB_HOST` | Yes | PostgreSQL host | `localhost` |
| `DB_PORT` | Yes | PostgreSQL port | `5432` |
| `DB_NAME` | Yes | PostgreSQL database name | `cropvision_db` |
| `RESEND_API_KEY` | No | API Key gửi quy trình OTP | `your_resend_api_key` |
| `JWT_SECRET` | Yes | Secret cho xác thực token | `replace_with_...` |
| `ADMIN_FULL_NAME`| No | Tên hiển thị của Admin mặc định | `CropVision Admin` |
| `ADMIN_EMAIL` | No | Email đăng nhập của Admin mặc định | `admin@cropvision.local` |
| `ADMIN_PASSWORD` | No | Mật khẩu Admin mặc định | `Admin@123` |
| `AI_CORE_URL` | No | URL trỏ tới dịch vụ AI | `http://127.0.0.1:8000` |
<!-- AUTO-GENERATED: ENV -->

## Development Workflow

1. Thiet lap moi truong local (Clone repo, cai Node.js/Python/Postgres).
2. Tao cac branch feature (`feature/xyz`).
3. Kiem tra log, chay clean code va tranh push cac loi hien thi `console.log`.
4. Submit PR!
