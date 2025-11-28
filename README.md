# Nodejs---Using-Typescript

Minimal Express + TypeScript backend scaffold.

Run locally:

```powershell
npm install
npm run dev
```

Endpoints:

- `GET /health` - health check
- `GET /error` - sample operational error to verify error handling

Notes:

- Config validated via `src/config/env.ts` using `zod`.
- Centralized error handling in `src/middlewares/errorHandler.ts`.
- Structured logging via `pino` wrapper at `src/utils/logger.ts`.
