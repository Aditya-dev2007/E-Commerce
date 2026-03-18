# SmartStore - Production Ready Online Retail System

Full-stack e-commerce application with dynamic pricing, 3D hero UI, real-time order tracking, and admin analytics.

## Quick Start

### 1) Database Setup (pick one)

#### Option A (recommended): Docker MySQL (1 command)
```bash
docker compose up -d
```

This will start MySQL 8, create the `smart_store` database, and import `database/schema.sql` automatically.

#### Option B: Use your local MySQL
Create a dedicated DB user (recommended):

```bash
mysql -u root -p < database/create_user_and_db.sql
mysql -u smartstore -p smart_store < database/schema.sql
```

### 2) Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm install
npm run db:doctor
npm run dev
```

### 3) Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visit: http://localhost:5173 (Vite may auto-pick 5174/5175 if busy)

## Demo Credentials
- Admin: admin@smartstore.com / Admin@123
- User:  raj@example.com / User@123

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS + Framer Motion + Three.js
- Backend: Node.js + Express.js (MVC)
- Database: MySQL (fully normalized, indexed)
- Auth: JWT + bcrypt

## Features
- Dynamic pricing (demand/stock based)
- 3D animated hero (Three.js)
- Product filters, search, sort, pagination
- Cart with real-time price calculation
- Multi-step checkout
- Order tracking (Placed → Delivered)
- Wishlist
- Reviews with verified purchase badge
- User dashboard
- Admin dashboard with analytics
- Low stock alerts
- Frequently bought together

## Deployment
- Frontend: Vercel (connect GitHub repo, set `VITE_API_URL`)
- Backend: Render/Railway (set all backend env vars)
- Database: Railway MySQL / PlanetScale / AWS RDS

### Recommended deployment (Railway MySQL + Render API + Vercel UI)

#### 1) Create MySQL database (Railway)
- Create a **MySQL** service in Railway.
- Copy these values from Railway:
  - **host**, **port**, **user**, **password**, **database**
- Import schema:
  - Use Railway’s SQL console (or any MySQL client) to run `database/schema.sql`.

#### 2) Deploy backend (Render or Railway)
- Deploy the `backend/` folder as a Node service.
- Start command:

```bash
npm install && npm start
```

- Set these backend environment variables:
  - `NODE_ENV=production`
  - `PORT=5000` (Render may override; that’s OK)
  - `DB_HOST=...`
  - `DB_PORT=...`
  - `DB_USER=...`
  - `DB_PASSWORD=...`
  - `DB_NAME=...`
  - `JWT_SECRET=...` (use a long random string)
  - `JWT_EXPIRES_IN=7d`
  - `FRONTEND_URL=...` (your deployed Vercel URL, e.g. `https://your-app.vercel.app`)

- After deploy, verify health:
  - Open: `<YOUR_BACKEND_URL>/api/health`
  - Expect: `success: true` and `db.connected: true`

#### 3) Deploy frontend (Vercel)
- Deploy the `frontend/` folder as a Vite/React app.
- Set this environment variable in Vercel:
  - `VITE_API_URL=<YOUR_BACKEND_URL>/api`

Example:
- If backend is `https://smartstore-api.onrender.com`, set:
  - `VITE_API_URL=https://smartstore-api.onrender.com/api`

#### 4) CORS note
Backend allows `FRONTEND_URL` in production. Make sure `FRONTEND_URL` exactly matches your Vercel domain.

### Required environment variables

#### Backend (`smart-store/backend/.env`)
- `PORT=5000`
- `NODE_ENV=production`
- `DB_HOST=...`
- `DB_PORT=3306`
- `DB_USER=...`
- `DB_PASSWORD=...`
- `DB_NAME=smart_store`
- `JWT_SECRET=...`
- `JWT_EXPIRES_IN=7d`
- `FRONTEND_URL=...` (your deployed frontend URL)

#### Frontend (`smart-store/frontend/.env`)
- `VITE_API_URL=...` (your deployed backend URL + `/api`)

### GitHub notes
- Never commit `.env` files. Only commit `.env.example`.
- `node_modules` and build folders are ignored via `.gitignore`.
