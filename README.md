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
- Khong commit file build, file upload, hoac file `.env`
