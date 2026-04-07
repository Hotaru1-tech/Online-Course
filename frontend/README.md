# Frontend

React + Vite frontend for the online course platform.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`

## Environment Variables

```env
VITE_API_URL=https://your-backend.onrender.com
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Vercel Deployment

Use these settings:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Notes

- The app expects the backend base URL in `VITE_API_URL`.
- Client-side routing requires a rewrite to `index.html`, which is configured in `vercel.json`.
