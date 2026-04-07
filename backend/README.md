# Backend

Express backend with Prisma, MySQL, optional Redis caching, Swagger, and GraphQL.

## Scripts

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run start:migrate`
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:migrate`
- `npm run seed`

## Environment Variables

```env
PORT=4000
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
# REDIS_URL=redis://default:PASSWORD@HOST:PORT
SEED=false
DB_RETRY_ATTEMPTS=25
DB_RETRY_DELAY_MS=500
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

## Render Deployment

Use these settings:

- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run prisma:generate && npm run build`
- **Start Command**: `npm run start:migrate && npm start`

## Health Checks

- `GET /health`
- `GET /api/docs`
- `POST /api/auth/login`
- `GET /graphql`

## Notes

- Redis is optional and is used only for caching when `REDIS_URL` is configured.
- `SEED=true` should be used only for initial/demo deployments.
- Uploaded files are stored locally under `uploads/` and are not durable on ephemeral hosts.
