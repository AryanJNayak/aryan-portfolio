# 🛠️ Portfolio — Setup & Run Guide

Full-stack portfolio: **FastAPI + MongoDB Atlas** backend and **React + TypeScript + Vite** frontend.

## Project structure

```
Portfolio/
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # App entry + router registration
│   │   ├── config.py            # Env config (pydantic-settings)
│   │   ├── database.py          # MongoDB Atlas + GridFS
│   │   ├── routes/              # auth, projects, github, leetcode, media, contact, profile
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── services/            # GitHub sync, LeetCode fetch, project/media/auth logic
│   │   ├── middlewares/         # JWT auth guard
│   │   └── utils/               # security (hashing, JWT)
│   ├── requirements.txt
│   └── .env.example
└── frontend/                    # React + TS app
    ├── src/
    │   ├── components/          # Reusable UI (Navbar, cards, background…)
    │   ├── sections/            # Page sections (Hero, About, Projects…)
    │   ├── admin/               # Admin panel + TipTap rich editor
    │   ├── api/                 # API-calling layer (axios)
    │   ├── types/               # TypeScript interfaces
    │   ├── schemas/             # Client-side validation
    │   ├── hooks/ · lib/        # Theme/profile hooks, fallback data, icons
    ├── public/AryanNayak.pdf    # Downloadable resume
    └── package.json
```

## 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# then edit .env -> set MONGODB_URI, ADMIN_PASSWORD, JWT_SECRET

uvicorn app.main:app --reload --port 8000
```

- API root: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### Required `.env` values
| Key | What it is |
|-----|------------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials to log in at `/admin` |
| `JWT_SECRET` | Random secret — `python -c "import secrets;print(secrets.token_hex(32))"` |
| `GITHUB_USERNAME` | `AryanJNayak` (public repos import) |
| `LEETCODE_USERNAME` | `Jsjsn73` (stats card) |
| `REDIS_URL` | Optional. Local `redis://localhost:6379/0` or Upstash `rediss://…`. Leave empty to use MongoDB cache only. |

### Admin data sync (important)

Public visitors **never** call GitHub or LeetCode. After you log in at `/admin`, click **Sync Data** to:

1. Live-fetch GitHub repos + READMEs and LeetCode stats  
2. Store them in MongoDB (and Redis when `REDIS_URL` is set)  
3. Serve that snapshot to the public site until you sync again  

If Redis is unset or down, the API still works using the MongoDB `cache` collection.

## 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Site: http://localhost:5173
- Admin: http://localhost:5173/admin
- The Vite dev server proxies `/api/*` to the backend on port 8000.

## 3. MongoDB Atlas (2-minute setup)

1. Create a free cluster at https://www.mongodb.com/atlas
2. Database Access → add a user + password.
3. Network Access → allow your IP (or `0.0.0.0/0` for dev).
4. Connect → Drivers → copy the connection string → paste into `backend/.env` as `MONGODB_URI`.

## Notes
- The site renders even without the backend (bundled fallback data), but projects,
  LeetCode live stats, contact form, and the admin panel require the backend + Atlas.
- Uploaded images/videos are stored **inside MongoDB (GridFS)** — no S3/Cloudinary needed.
