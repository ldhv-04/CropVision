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

Database trong Docker la nguon PostgreSQL chuan cho local setup. De tranh loi `password authentication failed for user "postgres"`, file `.env` o root repo phai duoc tao truoc khi chay Docker va phai giu cung mot bo `POSTGRES_*` trong suot vong doi volume `postgres_data`.

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
POSTGRES_PASSWORD=12345678
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

Neu day la lan dau tien ban cai Docker cho repo nay, hoac ban tung doi password Postgres truoc do, hay reset database volume truoc:

```powershell
docker compose down -v
```

Lenh nay xoa volume `postgres_data` cu de PostgreSQL khoi tao lai bang dung thong tin trong file `.env` hien tai.

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
- PostgreSQL se tao user/database theo `POSTGRES_*` trong file `.env`
- PostgreSQL se tu tao schema tu `backend/initdb/001-init.sql`

Neu root `.env` thieu `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `BACKEND_PORT`, hoac `AI_CORE_PORT`, Docker Compose se dung ngay thay vi fallback ngam sang gia tri khac.

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
EXPO_PUBLIC_API_PROTOCOL=http
EXPO_PUBLIC_API_HOST=127.0.0.1
EXPO_PUBLIC_API_PORT=3000
```

Sau do:

```powershell
cd App
copy .env.example .env
npm install
npm run dev:desktop
```

Neu file `.env` da co san, chi can dam bao `EXPO_PUBLIC_API_HOST` dung gia tri dung.

### Truong hop frontend chay tren may hoac thiet bi khac

Dat:

```env
EXPO_PUBLIC_API_HOST=<ip-may-chay-docker>
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

Luu y quan trong voi PostgreSQL:

- `POSTGRES_PASSWORD` chi duoc ap dung khi volume `postgres_data` duoc tao lan dau
- Neu ban da tung chay stack voi mot password khac, viec sua file `.env` khong tu dong doi password trong database cu
- Trong truong hop do, can `docker compose down -v` roi `docker compose up --build` de dong bo lai DB theo dung env

## 7. Luu y quan trong

- Model YOLO da duoc dong goi san vao image `ai_core`
- Khong can mount model tu host de chay local tren may moi
- `backend/.env` khong duoc su dung khi chay bang Docker Compose
- Cau hinh Docker runtime di qua file `.env` o root repo
- `backend/.env` chi dung khi chay `npm run dev` truc tiep trong thu muc `backend`
- Neu backend local ket noi toi PostgreSQL trong Docker, `backend/.env` phai dung cung `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` tuong ung voi root `.env`
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
- root `.env` va du lieu trong volume `postgres_data` dang lech password

Kiem tra:

```powershell
docker compose ps
docker compose logs backend --tail=100
```

Neu log backend co thong bao `password authentication failed for user "postgres"`:

```powershell
docker compose down -v
copy .env.docker.example .env
docker compose up --build
```

Neu ban can giu mot password khac voi file mau, hay sua file `.env` truoc khi khoi dong lai, nhung van phai xoa volume cu bang `docker compose down -v`.

### Frontend dang nhap khong duoc tu thiet bi khac

Nguyen nhan thuong gap:

- dang de `EXPO_PUBLIC_API_HOST=127.0.0.1`

Can sua thanh:

```env
EXPO_PUBLIC_API_HOST=<ip-may-chay-docker>
```

### Dang ky tai khoan bi loi gui email

Nguyen nhan:

- chua cau hinh `RESEND_API_KEY`

Neu can OTP qua email, hay cap nhat file `.env` o root repo va restart backend:

```powershell
docker compose up -d --build backend
```
