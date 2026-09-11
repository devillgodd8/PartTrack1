# PartTrack — Automotive Parts Tracking Portal

A private, self-hosted web application for manual tracking number management of automotive parts (engines & transmissions).

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS v3
- **Backend**: Node.js + Express
- **Database**: SQLite (via Knex.js — swappable to PostgreSQL)
- **Auth**: JWT in httpOnly cookies + bcrypt password hashing

## Prerequisites

- Node.js 18+ (tested on Node 24)
- npm 9+

## Quick Start

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env to set your JWT_SECRET and admin credentials
```

**Key environment variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `JWT_SECRET` | Secret key for JWT signing | (change this!) |
| `JWT_EXPIRY` | Token expiry duration | `24h` |
| `DB_PATH` | SQLite database file path | `./data/parttrack.db` |
| `ADMIN_EMAIL` | Initial admin email | `admin@parttrack.local` |
| `ADMIN_PASSWORD` | Initial admin password | `ChangeMe123!` |
| `FRONTEND_URL` | Frontend origin (for CORS) | `http://localhost:5173` |

### 3. Set Up Database

```bash
cd backend

# Create tables
npm run migrate

# Seed initial admin user
npm run seed
```

### 4. Run Locally

Open two terminals:

```bash
# Terminal 1: Backend (port 5000)
cd backend
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

### 5. Login

Open http://localhost:5173 in your browser.

- **Admin**: `admin@parttrack.local` / `ChangeMe123!` (or whatever you set in `.env`)

## Project Structure

```
Part Track/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express entry point
│   │   ├── db/
│   │   │   ├── migrations/    # Database schema
│   │   │   └── seeds/         # Initial admin user
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT + role middleware
│   │   │   ├── rateLimiter.js # Login rate limiting
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js        # Login/logout/session
│   │   │   ├── users.js       # User CRUD (admin)
│   │   │   ├── tracking.js    # Tracking records CRUD
│   │   │   ├── activity.js    # Activity log (admin)
│   │   │   └── dashboard.js   # Stats endpoint
│   │   └── utils/
│   │       ├── constants.js   # Enums (statuses, part types)
│   │       └── validators.js  # Input validation
│   ├── knexfile.js            # DB config (SQLite/PostgreSQL)
│   └── .env.example
├── frontend/
│   └── src/
│       ├── api/               # Axios API layer
│       ├── components/        # Reusable UI components
│       ├── context/           # Auth context
│       └── pages/             # Route pages
│           ├── admin/         # Admin-only pages
│           └── user/          # User-only pages
└── README.md
```

## Features

### User Roles
- **Admin**: Full access — manage users, all tracking records, activity log, dashboard stats
- **User**: Scoped access — own records only, create records, update status

### Tracking Statuses
Pending → Processing → Picked Up → In Transit → Out for Delivery → Delivered

Additional: Delayed, Cancelled, On Hold

### Security
- Passwords hashed with bcrypt (12 rounds)
- JWT stored in httpOnly cookies (not localStorage)
- Role-based middleware on all backend routes
- Query-level scoping (users can never access others' records)
- Rate limiting on login endpoint
- CORS restricted to frontend origin
- Input validation on all endpoints

## Switching to PostgreSQL

1. Install the PostgreSQL driver:
   ```bash
   cd backend
   npm install pg
   ```

2. Update `knexfile.js` — uncomment the PostgreSQL config and set as default

3. Add PostgreSQL env vars to `.env`:
   ```
   PG_HOST=localhost
   PG_PORT=5432
   PG_DATABASE=parttrack
   PG_USER=parttrack
   PG_PASSWORD=your_password
   ```

4. Run migrations against the new database:
   ```bash
   npm run migrate
   npm run seed
   ```
