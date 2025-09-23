# Bisutoro Client (React + Vite + Tailwind)

Admin dashboard and public site for Bisutoro.

## Setup

1. Copy an env file:
   - `.env.development.example` → `.env.development`
   - Set `VITE_API_BASE_URL` to your API server (e.g. http://localhost:4000)
2. Install deps: `npm install`
3. Run dev: `npm run dev`
4. Build: `npm run build`

## Deploy (Render Static Site)

This repo includes `render.yaml`. Render will build with:

```
npm ci --include=dev && npm run build
```

and publish `dist/`. Client-side routes are handled by a rewrite to `/index.html`.

You must set `VITE_API_BASE_URL` in Render (Environment tab) to your API URL.

## Logging

- A lightweight console logger is included for troubleshooting.
- Control verbosity via `VITE_LOG_LEVEL`: `debug`, `info` (default in prod), `warn`, `error`, `silent`.
- On startup, the app logs `{ env, prod, baseUrl }`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run preview` — preview prod build locally
