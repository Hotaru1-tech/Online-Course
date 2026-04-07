# Online Course Platform

This repository contains three deployable parts:

- **Frontend**: React + Vite app in `frontend/`, intended for Vercel.
- **Backend**: Express + Prisma app in `backend/`, intended for Render.
- **Database**: MySQL, intended for Railway.

## Repository Structure

```text
.
├─ backend/
├─ frontend/
└─ docker-compose.yml
```

## Local Development

### Prerequisites

- Node.js 20+
- npm
- MySQL 8

### Docker Compose

From the repository root:

```bash
docker compose up --build
```

Services:

- MySQL: `localhost:3307`
- Backend: `http://localhost:4000`
- Frontend: run separately from `frontend/`

### Backend local run

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

### Frontend local run

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Deployment Target Split

- **Railway**: MySQL database only
- **Render**: backend web service
- **Vercel**: frontend static site

## Required Environment Variables

### Backend

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_URL` optional
- `SEED` optional, use `false` in production after first seed
- `DB_RETRY_ATTEMPTS` optional
- `DB_RETRY_DELAY_MS` optional

### Frontend

- `VITE_API_URL` set to your Render backend URL, for example:

```env
VITE_API_URL=https://your-backend.onrender.com
```

## Railway MySQL Deployment

1. Create a new Railway project.
2. Add a **MySQL** service.
3. Open the MySQL service connection details.
4. Copy the private or public connection string.
5. Convert it to Prisma MySQL format if needed:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

6. Use that `DATABASE_URL` in Render for the backend.

## Render Backend Deployment

Create a new **Web Service** from the `backend` folder.

### Render settings

- **Root Directory**: `backend`
- **Build Command**:

```bash
npm install && npm run prisma:generate && npm run build
```

- **Start Command**:

```bash
npm run start:migrate && npm start
```

### Render environment variables

```env
PORT=4000
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
# REDIS_URL=redis://default:PASSWORD@HOST:PORT
SEED=false
DB_RETRY_ATTEMPTS=25
DB_RETRY_DELAY_MS=500
```

## Vercel Frontend Deployment

Create a new Vercel project from the `frontend` folder.

### Vercel settings

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Vercel environment variables

```env
VITE_API_URL=https://your-backend.onrender.com
```

## Production Bring-up Order

1. Deploy MySQL on Railway.
2. Deploy backend on Render using Railway MySQL.
3. Confirm backend health at `/health`.
4. Deploy frontend on Vercel using the Render backend URL.
5. Re-test login, course listing, enrollments, uploads, and certificates.

## Endpoints to verify after deployment

- Backend health: `/health`
- Swagger docs: `/api/docs`
- GraphQL: `/graphql`
- Frontend app loads and can call `/api/*` through `VITE_API_URL`

## Current deployment caveats

- File uploads are stored on the backend filesystem. On many cloud platforms this storage is ephemeral.
- If you need durable uploads in production, move uploaded PDFs to object storage such as S3, Cloudinary, or Supabase Storage.
- CORS is currently open to all origins.
