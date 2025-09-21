# API usage in client

The client reads `VITE_API_BASE_URL` from environment variables to prefix requests.

- When empty or unset, requests go to the same origin (e.g. `/api/menu`).
- Set `VITE_API_BASE_URL` in a `.env` file (copied from `.env.example`) if your API runs on a different host/port.

Endpoints used:

- GET `/api/menu` → returns an array of categories, or `{ categories: [...] }`.

Timeouts:

- Requests use a 10s timeout for basic resiliency.

Notes:

- `credentials: 'include'` is enabled for session cookies if your API uses them.
