# Runbook: CropVision AI

Tai lieu huong dan van hanh, xu ly su co, va quan tri cac node tu backend, ai_core den database.

## Deployment Procedures

Ban co the nhanh chong khoi tao stack thong qua Docker Compose:

1. Clone source code
2. Tao file `.env` root theo mau `.env.docker.example`
3. Chay backend, database, va AI module:
   ```bash
   docker compose up -d --build
   ```

## Health Check Endpoints
San sang tich hop vao bat ky he thong giam sat (uptime kuma, prometheus, v.v.):

- **Backend:** `GET /api/health` 
  - Tra ve `{"success": true, "service": "backend", "port": "3000"}` va kiem tra ket noi Database ngam.
- **AI Core:** `GET /health` 
  - Tra ve `{"success": true, "model_path": "..."}` va xac nhan FastAPI song.
- **Database:** `pg_isready -h 127.0.0.1` qua healthcheck cua Docker.

## Common Issues & Handling

1. **AI Core Memory Exhaustion (OOM):**
   - **Trieu chung:** Container `cropvision-ai-core` chet/restart lien tuc.
   - **Cach xu ly:** Backend da gioi han 10MB bang Multer. AI Core stream 64KB chunks. Neu van OOM, xac nhan ban dang dung model YOLO Nano hoac luong RAM host du (>= 1GB).

2. **Doi JWT Secret hoac Postges Password**
   - **Trieu chung:** Backend loi auth, app bi disconnect.
   - **Cach xu ly:** Xoa local volume cho database de trigger init lai (`docker compose down -v`). Bat buoc cap nhat moi .env tu dong bo.

3. **Email OTP khong toi**
   - **Trieu chung:** `SendOTP` response that bai, khach hang bao loi 4xx dang ky.
   - **Cach xu ly:** Kiem tra log backend, kiem tra lai `RESEND_API_KEY` co tren moi truong hay khong.
