# CropVision

CropVision la he thong phat hien benh la cay bang YOLOv8, gom 3 thanh phan van hanh tach biet:

- `App/`: ung dung giao dien Expo + React Native Web + Electron
- `backend/`: API Node.js/Express ket noi PostgreSQL
- `ai_core/`: dich vu AI Core bang FastAPI + YOLOv8

## Cau truc repo

```text
cropvision_db/
|-- App/        # frontend desktop/web
|-- backend/    # API, auth, admin, history
|-- ai_core/    # inference service
|-- README.md   # tai lieu van hanh root
```

## Nguyen tac repo

- Chi track source code va cau hinh can thiet
- Khong track build artifacts nhu `dist/`, `release/`
- Khong track runtime data nhu `backend/uploads/`
- Khong track moi truong local nhu `.env`, `venv/`, `__pycache__/`

## Yeu cau moi truong

- Node.js 18+
- npm 9+
- Python 3.10+
- PostgreSQL 14+
- Docker Desktop 4+ (khuyen nghi cho local dev nhanh)

## Chay bang Docker

Mac dinh stack Docker se khoi dong `db`, `backend`, va `ai_core`. Frontend van chay ngoai Docker trong thu muc `App`.
Model YOLO duoc dong goi san trong image `ai_core`, nen may khac chi can co repo + Docker Desktop.

Tai lieu day du:

- [docs/docker-setup.md](docs/docker-setup.md)

```powershell
copy .env.docker.example .env
docker compose down -v
docker compose up --build
```

Sau khi stack len:

- Backend: `http://127.0.0.1:3000/api/health`
- AI Core: `http://127.0.0.1:8000/health`
- PostgreSQL: `127.0.0.1:5432`

Neu chay frontend tren cung may:

- Dat `EXPO_PUBLIC_API_ORIGIN=http://127.0.0.1:3000`

Neu chay frontend tren may khac trong cung mang LAN:

- Dat `EXPO_PUBLIC_API_ORIGIN=http://<ip-may-chay-docker>:3000`
- Khong dung `127.0.0.1` vi se tro ve chinh thiet bi client
- Neu IP LAN cua may host thay doi, can cap nhat lai `App/.env` hoac dat lai `EXPO_PUBLIC_API_ORIGIN`

De chay frontend local voi stack Docker:

```powershell
cd App
copy .env.example .env
npm install
npm run dev:desktop
```

Trong `App/.env`, dat:

```powershell
EXPO_PUBLIC_API_ORIGIN=http://127.0.0.1:3000
```

De dung stack:

```powershell
docker compose down
```

Du lieu Postgres va uploads duoc giu qua Docker volumes. Neu muon xoa sach local data:

```powershell
docker compose down -v
```

## Thiet lap nhanh

### 1. Backend

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

### 2. AI Core

```powershell
cd ai_core
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python ai_core.py
```

### 3. Frontend desktop/web

```powershell
cd App
npm install
npm run dev:desktop
```

Neu frontend khong goi cung may voi backend, tao `App/.env` va set IP cua may dang chay Docker:

```powershell
EXPO_PUBLIC_API_ORIGIN=http://<ip-may-chay-docker>:3000
```

Desktop/Electron mac dinh se goi backend local tai `http://127.0.0.1:3000`. `EXPO_PUBLIC_API_ORIGIN` duoc uu tien cao nhat neu co mat, va bat buoc phai tro den IP may host neu frontend nam o may/thiet bi khac.

## Thu tu khoi dong khuyen nghi

1. Khoi dong PostgreSQL
2. Khoi dong `backend`
3. Khoi dong `ai_core`
4. Khoi dong `App`

## Bien moi truong

Backend dung file `backend/.env`. Muc toi thieu:

- `PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `RESEND_API_KEY`
- `JWT_SECRET` (khuyen nghi bo sung)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FULL_NAME`

Frontend co the dung file `App/.env` voi:

- `EXPO_PUBLIC_API_ORIGIN`
- `EXPO_PUBLIC_API_PROTOCOL`
- `EXPO_PUBLIC_API_HOST`
- `EXPO_PUBLIC_API_PORT`

Docker Compose doc file `.env` o root repo voi:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `BACKEND_PORT`
- `AI_CORE_PORT`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `ADMIN_FULL_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Khi chay bang Docker, `backend/.env` khong duoc su dung. Toan bo cau hinh cho `db`, `backend`, `ai_core` di qua file `.env` o root repo.
`POSTGRES_PASSWORD` trong root `.env` chi co hieu luc khi volume `postgres_data` duoc tao lan dau. Neu tung chay DB voi password khac, can `docker compose down -v` truoc khi khoi dong lai de tranh loi `password authentication failed for user "postgres"`.

## Tai khoan admin mac dinh

Neu khong override bang bien moi truong, backend se tu khoi tao:

- Email: `admin@cropvision.local`
- Mat khau: `Admin@123`

## Thu muc sinh ra khi chay

- `backend/uploads/`: anh upload tu backend
- `App/dist/`: web bundle
- `App/release/`: artifact build desktop
- `ai_core/venv/`: moi truong Python cuc bo

Tat ca cac thu muc tren deu duoc ignore khoi git.

## Ghi chu van hanh

- Neu thay doi API output cua `ai_core`, can restart AI Core de frontend nhan schema moi
- Neu thay doi auth/admin route o `backend`, can restart backend
- Co the kiem tra backend bang `GET /api/health` truoc khi debug dang nhap
- Khong commit file build, file upload, hoac file `.env`
- Tren may moi, khong can cai rieng PostgreSQL, Python, hoac Node.js de chay stack backend/AI/DB neu da dung Docker
- Tinh nang gui OTP email can `RESEND_API_KEY` hop le; neu de trong, backend van khoi dong duoc nhung dang ky qua email se that bai
