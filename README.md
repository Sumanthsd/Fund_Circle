# Friends Chit Fund

Chit fund web application structured like `networth_hub`.

## Stack

- Frontend: React + Vite SPA in `frontend/`
- Backend: Node.js + Express REST API in `backend/`
- Auth: Clerk sign-in and new-user sign-up
- Database: SQLite via `sqlite3`
- Backend structure: routes -> controllers -> services -> models

## What The App Does

- Shows login/sign-up first.
- After login, loads chit cycle data from the backend.
- Seeds the first completed cycle, second completed cycle, and third draft cycle on backend startup.
- Tracks cycle members, months, monthly contributions, payout recipient, and selection method.
- Includes a random name picker for non-emergency draws.
- Adds avatar menu `Chit Profile` page for mobile number, gender, and DOB.

## Environment Setup

Create `backend/.env`:

```bash
SQLITE_DB_PATH=./data/chit_fund.sqlite
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAILS=admin@example.com
PORT=4000
```

Create `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

The backend stores data in a local SQLite file. If `SQLITE_DB_PATH` is omitted, it defaults to `backend/data/chit_fund.sqlite`.

`ADMIN_EMAILS` is a comma-separated list of master/admin users who can add/edit/delete members, mark contributions, and finalize draws. If omitted, all authenticated users are treated as admin.

## Install

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

## Run Locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:4000/health
```

## Helper

```powershell
.\scripts\start-local.ps1
```

The helper also shows which local SQLite file the backend will use.

## Important Folders

- `frontend/src/pages`: login/signup and dashboard pages
- `frontend/src/services`: Axios API services
- `backend/routes`: REST route definitions
- `backend/controllers`: request/response handlers
- `backend/services`: validation and business logic
- `backend/models`: SQLite-backed queries
- `backend/config/schemaInit.js`: schema creation and seed data
