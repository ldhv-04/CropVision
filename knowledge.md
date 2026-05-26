# CropVision AI — Project Knowledge

Plant-leaf disease detection system (YOLOv8 + Gemini chat) with a tri-platform frontend (Web / Electron Desktop / Android-iOS) and a dual-persona UX:
- **AgriVision** — Mobile-first UI for farmers (Bottom Tabs + Drawer, light theme)
- **CropVision Station** — Desktop/Web UI for admins/analysts (CSS Grid, dark theme)

Role-based routing in Expo Router: admins land in `(station)`, regular users in `(agrivision)`.

## Architecture

Three independent services orchestrated via `docker-compose.yml`:

| Path | Stack | Purpose |
|------|-------|---------|
| `App/` | Expo SDK 55 + Expo Router + React 19 + Zustand | Web/Desktop/Mobile UI |
| `backend/` | Node.js 18+ / Express 5 / `pg` / JWT / Multer | REST API, auth, business logic |
| `ai_core/` | FastAPI + Ultralytics YOLOv8 | Image inference (`/predict`) |
| `db` (compose) | PostgreSQL 16 | Persistent store, init via `backend/initdb/*.sql` |

Data flow: **App → backend (`/api/...`) → ai_core (`AI_CORE_URL`) + Postgres**. Backend forwards uploaded images to AI Core, persists results in `crop_samples`.

### Key directories

- `App/app/` — Expo Router file-based routes. Route groups: `(auth)`, `(agrivision)`, `(station)`, `(main)` (legacy).
- `App/src/modules/` — Three-layer module pattern:
  - `@core/` — design tokens, `apiClient`, `endpoints`, `useAuthStore`, `AppShell`, `GridShell` widgets, `ThemeContext`
  - `platform/` — adaptive services (`ImagePickerService`, `useLayoutMode`, `usePlatformInfo`)
  - Feature modules: `agrivision/`, `inference/`, `history/`, `admin/`, `station/`, `landing/`
- `App/src/screens/` and `App/src/navigation/` — **legacy** (phasing out, do not extend).
- `backend/src/` — classic layered structure: `routes/ → controllers/ → services/ → models/ → config/db.js`. Auth middleware in `middleware/authMiddleware.js`.
- `backend/initdb/` — SQL bootstrapped by Postgres on first volume init: `001-init.sql`, `002-chat.sql`, `003-diseases.sql`.
- `ai_core/api/predict.py` — FastAPI predict endpoint; weights at `ai_core/weight/archive/best.pt`.
- `specs/` — feature specs/plans (e.g. `phase-1-dual-platform/`).

## Commands

### Docker (recommended full stack — db + backend + ai_core; App still runs outside Docker)
```powershell
copy .env.docker.example .env   # set JWT_SECRET, POSTGRES_*, RESEND_API_KEY, GEMINI_API_KEY
docker compose up --build
docker compose down              # stop
docker compose down -v           # wipe DB volume (required after changing POSTGRES_PASSWORD)
```

### Backend (`cd backend`)
```powershell
copy .env.example .env
npm install
npm run dev              # nodemon
npm start                # node server.js
npm test                 # jest (tests in backend/tests/)
npm run test:coverage
```

### AI Core (`cd ai_core`)
```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py           # uvicorn on 127.0.0.1:8000
pytest                   # tests in ai_core/tests/
```

### App (`cd App`)
```powershell
npm install
npm run dev:desktop      # web (8081) + Electron — primary dev workflow
npm run web              # web only on :8081
npm run android | ios    # native (requires native toolchain)
npm run export:web       # production web bundle to App/dist/
npm run build:win        # electron-builder NSIS installer to App/release/
npm test                 # jest (jest-expo/node preset); ignores /e2e/
npm run test:coverage
npx playwright test      # e2e (auto-starts expo web; see playwright.config.ts)
```

Recommended boot order locally: **db → backend → ai_core → App**.

## Environment variables (must read)

- **`backend/.env`** — `JWT_SECRET` is REQUIRED; backend refuses to start without it. Other required: `DB_USER/PASSWORD/HOST/PORT/NAME`, `PORT`. Optional: `RESEND_API_KEY` (Resend; if missing, email/OTP registration fails but server still boots), `AI_CORE_URL` (default `http://127.0.0.1:8000`), `ADMIN_EMAIL/PASSWORD/FULL_NAME` (default `admin@cropvision.local` / `Admin@123`), `GEMINI_API_KEY` (chat).
- **Root `.env`** (Docker only) — `POSTGRES_DB/USER/PASSWORD/PORT`, `BACKEND_PORT`, `AI_CORE_PORT`, `JWT_SECRET` all required (compose fails fast otherwise).
- **`App/.env`** — `EXPO_PUBLIC_API_PROTOCOL/HOST/PORT` or single `EXPO_PUBLIC_API_ORIGIN` override. Use `127.0.0.1` for same-machine dev; LAN IP for device testing.

Generate a strong JWT secret:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Conventions

- **Backend**: CommonJS (`"type": "commonjs"`); pure-SQL data access in `models/` (no ORM); business rules in `services/`; controllers stay thin. Add new routes by creating `routes/xxxRoutes.js` and mounting in `server.js`.
- **App**: ES modules + JSX (`.js`/`.jsx`). State via **Zustand stores** colocated under `src/modules/<feature>/store/`. API access goes through `@core/api/apiClient.js` + `endpoints.js` (do not hand-roll fetch/origin logic — it breaks Electron/LAN scenarios).
- **Theming**: `App/src/modules/@core/context/ThemeContext.jsx` + design tokens in `@core/constants/theme.js`. Station = dark default, AgriVision = light default; both user-overridable.
- **Routing**: Role-based redirect lives in `App/app/_layout.js`. New farmer screens go in `(agrivision)/`; new admin screens in `(station)/`. `(main)/` is legacy.
- **Image upload**: Limit 10 MB, types JPEG/PNG/WebP/GIF — validated at both multer route layer AND service layer; keep both in sync.
- **DB schema for inference**: `crop_samples` carries `field_id`, `source_type` (`mobile`/`drone`/`station`), `batch_id` — preserve these when adding columns (drone-batch readiness per `specs/phase-1-dual-platform/`).

## Gotchas

- **Windows shell** — repo paths use `F:\Documents\Khoa Luan 2026\cropvision_db`. Use `copy`/`del`/`move` (or quoted PowerShell). Default shell is bash; commands here assume PowerShell-friendly forms.
- **Postgres password change requires volume wipe** — `docker compose down -v` before changing `POSTGRES_PASSWORD`, otherwise the existing `postgres_data` volume keeps the old creds.
- **AI Core schema changes** — restart **both** `ai_core` and `backend`; backend caches no schema but axios payload shape will mismatch.
- **Android FormData** — multipart upload requires `Platform.OS` check (see recent commit `fix(app): fix FormData multipart formatting on Android`). Don't strip the platform branch in `ImagePickerService` / inference upload code.
- **Expo Web port** — Playwright `baseURL` is `http://localhost:8081`. If you change the `web` script port, update `App/playwright.config.ts` too.
- **Generated/local-only dirs (do not commit)**: `backend/uploads/`, `App/dist/`, `App/release/`, `ai_core/venv/`, `App/coverage/`, `App/test-results/`, `.env*`.
- **Auth debug log** — `backend/src/controllers/authController.js` currently logs raw passwords on login (uncommitted dev aid). Remove before any deploy.
- **New Architecture disabled** — `app.json` has `"newArchEnabled": false`. Don't flip it without testing all native modules (`react-native-reanimated`, `react-native-gesture-handler`, `react-native-screens`).
- **OpenWeatherMap** — free tier (1000 calls/day). Always go through `weather_cache` (target 15–30 min cache by rounded lat/lon) — see `weatherService.js`.

## API surface (high-level)

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/health` | — |
| POST | `/api/auth/register` `/verify` `/login` | — |
| POST | `/api/inference/analyze` | JWT |
| GET | `/api/inference/samples` | JWT |
| CRUD | `/api/fields/*` | JWT (farmer) |
| GET | `/api/weather/*` | JWT |
| POST | `/api/chat/*` | JWT |
| GET/DELETE | `/api/admin/*` | JWT + `role=admin` |
