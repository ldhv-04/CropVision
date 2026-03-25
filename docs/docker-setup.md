# Docker Setup Guide

## Muc tieu

Tai lieu nay huong dan chay stack `backend + ai_core + db` bang Docker tren may local moi.
Frontend trong `App/` khong chay trong Docker va se ket noi toi backend qua HTTP.

## Thanh phan trong stack

- `db`: PostgreSQL 16
- `backend`: Node.js/Express API
- `ai_core`: FastAPI + YOLOv8

Stack nay da duoc cau hinh de may moi chi can:

- clone repo
- cai Docker Desktop
- tao file `.env`
- chay `docker compose up --build`

## Yeu cau

- Docker Desktop 4+
- Git

Khong can cai rieng PostgreSQL, Python hay Node.js neu chi muon chay `backend + ai_core + db`.

## 1. Clone source code

```powershell
git clone https://github.com/ldhv-04/CropVision.git
cd CropVision
```

## 2. Tao file moi truong cho Docker

Copy file mau:

```powershell
copy .env.docker.example .env
```

Noi dung bien moi truong quan trong:

- `POSTGRES_DB`: ten database
- `POSTGRES_USER`: tai khoan postgres
- `POSTGRES_PASSWORD`: mat khau postgres
- `POSTGRES_PORT`: cong map ra host, mac dinh `5432`
- `BACKEND_PORT`: cong backend, mac dinh `3000`
- `AI_CORE_PORT`: cong AI Core, mac dinh `8000`
- `JWT_SECRET`: secret dung de ky token
- `RESEND_API_KEY`: API key cua Resend, co the de trong neu chua dung email OTP
- `ADMIN_FULL_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Vi du:

```env
POSTGRES_DB=cropvision_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

BACKEND_PORT=3000
AI_CORE_PORT=8000

JWT_SECRET=replace_with_a_strong_secret
RESEND_API_KEY=

ADMIN_FULL_NAME=CropVision Admin
ADMIN_EMAIL=admin@cropvision.local
ADMIN_PASSWORD=Admin@123
```

## 3. Khoi dong stack

```powershell
docker compose up --build
```

Neu muon chay nen:

```powershell
docker compose up -d --build
```

Lan dau tien:

- Docker se build image `backend`
- Docker se build image `ai_core`
- Docker se pull image `postgres:16`
- PostgreSQL se tu tao schema tu `backend/initdb/001-init.sql`

## 4. Kiem tra trang thai

Kiem tra container:

```powershell
docker compose ps
```

Tat ca service can o trang thai `Up` va `healthy`.

Kiem tra health endpoints:

```powershell
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:8000/health
```

Ket qua mong doi:

- Backend: `{"success":true,"service":"backend","port":"3000"}`
- AI Core: tra ve `success: true` va `model_path`

## 5. Ket noi frontend

Frontend trong `App/` chay ngoai Docker.

### Truong hop frontend chay tren cung may

Tao `App/.env`:

```env
EXPO_PUBLIC_API_ORIGIN=http://127.0.0.1:3000
```

Sau do:

```powershell
cd App
copy .env.example .env
npm install
npm run dev:desktop
```

Neu file `.env` da co san, chi can dam bao `EXPO_PUBLIC_API_ORIGIN` dung gia tri dung.

### Truong hop frontend chay tren may hoac thiet bi khac

Dat:

```env
EXPO_PUBLIC_API_ORIGIN=http://<ip-may-chay-docker>:3000
```

Khong dung `127.0.0.1` trong truong hop nay, vi no se tro ve chinh thiet bi client.

## 6. Du lieu va volume

Stack su dung 2 named volumes:

- `postgres_data`: luu du lieu PostgreSQL
- `backend_uploads`: luu anh upload tu backend

Khi stop stack thong thuong, du lieu van duoc giu lai:

```powershell
docker compose down
```

Neu muon xoa toan bo du lieu local:

```powershell
docker compose down -v
```

## 7. Luu y quan trong

- Model YOLO da duoc dong goi san vao image `ai_core`
- Khong can mount model tu host de chay local tren may moi
- `backend/.env` khong duoc su dung khi chay bang Docker Compose
- Cau hinh Docker runtime di qua file `.env` o root repo
- Neu `RESEND_API_KEY` de trong, backend van khoi dong duoc nhung chuc nang gui OTP email se that bai

## 8. Lenh huu ich

Xem log toan bo stack:

```powershell
docker compose logs -f
```

Xem log rieng backend:

```powershell
docker compose logs -f backend
```

Rebuild mot service:

```powershell
docker compose build backend
docker compose build ai_core
```

Khoi dong lai sau khi sua code backend/AI:

```powershell
docker compose up -d --build
```

## 9. Loi thuong gap

### Backend restart lien tuc

Nguyen nhan thuong gap:

- database chua healthy
- AI Core chua healthy
- loi bien moi truong

Kiem tra:

```powershell
docker compose ps
docker compose logs backend --tail=100
```

### Frontend dang nhap khong duoc tu thiet bi khac

Nguyen nhan thuong gap:

- dang de `EXPO_PUBLIC_API_ORIGIN=http://127.0.0.1:3000`

Can sua thanh:

```env
EXPO_PUBLIC_API_ORIGIN=http://<ip-may-chay-docker>:3000
```

### Dang ky tai khoan bi loi gui email

Nguyen nhan:

- chua cau hinh `RESEND_API_KEY`

Neu can OTP qua email, hay cap nhat file `.env` o root repo va restart backend:

```powershell
docker compose up -d --build backend
```
