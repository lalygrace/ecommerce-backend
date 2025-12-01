# Developer quickstart

This repository contains a backend Express API for an example ecommerce application.

Local setup

1. Copy environment example:

```bash
cp .env.example .env
# edit .env and set DATABASE_URL / GOOGLE_CLIENT_ID as needed
```

2. Install dependencies (this project uses pnpm):

```bash
pnpm install
```

3. Run the server in development:

```bash
pnpm dev
```

Key developer artifacts included

- `postman_collection.json` — ready-to-import Postman collection with representative requests and a sign-in test that saves the bearer token to the environment variable `token`.
- `openapi.yaml` — OpenAPI 3.0.3 spec generated from the routes and DTOs. Import into Swagger UI / Postman / Redoc.
- `docs/redoc.html` — static Redoc page that loads `openapi.yaml` for quick browsing (open with a static file server or via VS Code Live Server).

Postman import steps

1. Open Postman → Import → Choose `postman_collection.json`.
2. Create an environment with variable `baseUrl` (`http://localhost:3000`) and `token` (blank).
3. Run `Auth - Sign In` then check `token` is set (the request test tries several common response shapes).
4. Use `Authorization: Bearer {{token}}` header for protected requests.

OpenAPI / Swagger

- To preview locally with Redoc CLI (recommended):

```bash
pnpm add -D redoc-cli
npx redoc-cli serve openapi.yaml
```

Or open `docs/redoc.html` served from a simple static server.

Notes

- The project uses Better Auth (mounted at `/api/auth/*`). Exact auth route names depend on Better Auth’s configuration; the Postman Sign In/Sign Up requests assume conventional paths — adjust if your instance returns different shapes.
- DTOs live under `src/dtos` and are the source of truth for request validation (Zod schemas). Use them when creating clients.
