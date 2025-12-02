# Ecommerce Backend

Express + TypeScript backend for the Ecommerce Full-Stack project.

This repository contains the backend API implementation: Express routes, DTO validation (Zod), Prisma database access, Better Auth integration, and developer tooling (OpenAPI, Postman collection, and test helpers).

Project layout (important files)

- `src/` — application source (controllers, routes, services, middlewares, utils)
- `prisma/` — Prisma schema and migrations
- `postman_collection.json` — ready-to-import Postman collection
- `openapi.yaml` — OpenAPI 3.0 spec (representative)
- `API_DOCS.md` — human-friendly API summary and Postman guide
- `scripts/run_postman.sh` — wrapper to run the Postman collection with Newman

Table of contents

- Overview
- Prerequisites
- Quickstart (dev)
- Environment variables
- Database (Prisma)
- Running & testing
- Authentication (Better Auth)
- API docs & Postman
- Webhooks
- Logging & correlation IDs
- Troubleshooting
- Contributing

## Overview

This backend implements a typical ecommerce API with resources for Users, Products, Carts, Orders, Payments, Coupons, Reviews, Sellers and Vendors.

Key technologies

- Node.js + Express (TypeScript)
- Prisma (Postgres) for persistence
- Better Auth for authentication (email/password, JWT, bearer plugin)
- Zod for request validation (DTOs in `src/dtos`)
- Pino for structured logging

## Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm (preferred) or npm
- A Postgres database (configure `DATABASE_URL` in `.env`)

## Quickstart (development)

1. Install dependencies

```bash
pnpm install
# or: npm install
```

2. Copy example env (create a `.env` with required vars)

```bash
cp .env.example .env
# Edit `.env` and set DATABASE_URL and any auth provider keys
```

3. Run database migrations (Prisma)

```bash
npx prisma migrate deploy
# or for dev: npx prisma migrate dev
```

4. Start the dev server

```bash
pnpm run dev
# or: npm run dev
```

## Environment variables

Edit `.env` for runtime configuration. Key variables used by this project:

- `NODE_ENV` — `development`|`production`
- `PORT` — HTTP server port (default 3000)
- `DATABASE_URL` — Prisma/Postgres connection string
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — optional Google OAuth

## Authentication (Better Auth)

Authentication is provided by Better Auth and is mounted under `/api/auth/*` (see `src/app.ts`). The dev instance exposes the email sign-up/sign-in endpoints at:

- `POST /api/auth/sign-up/email` — register (Better Auth email strategy)
- `POST /api/auth/sign-in/email` — sign in with email/password

Behavior

- Better Auth may return a bearer token in the JSON response (fields like `token`, `accessToken` or `data.session.accessToken`) or set a session cookie via `Set-Cookie`. The project includes both JWT and Bearer plugins:
  - JWT endpoints: `/api/auth/token` and `/api/auth/jwks` (JWKS for remote verification)
  - Bearer plugin allows `Authorization: Bearer <token>` use

Client usage examples (curl)

Register a user (API-managed user creation):

```bash
curl -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"StrongPassw0rd!","name":"Alice"}'
```

Register via Better Auth (email sign-up path):

```bash
curl -i -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"StrongPassw0rd!","name":"Alice"}'
```

Sign in (email):

```bash
curl -i -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"StrongPassw0rd!"}'
```

Get current session (uses cookie or Authorization header):

```bash
curl -i -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/me
# or using cookie (if sign-in set Set-Cookie):
curl -i -H "Cookie: <session-cookie>" http://localhost:3000/api/v1/me
```

## API docs & Postman

- Human-friendly summary: `API_DOCS.md` (in project root)
- OpenAPI 3.0 spec (representative): `openapi.yaml`
- Postman collection (import into Postman): `postman_collection.json`
- Run Postman collection locally with Newman (helper provided):

```bash
./scripts/run_postman.sh http://localhost:3000
```

Notes:

- The Postman collection includes an `Origin: {{origin}}` header and captures either a bearer `{{token}}` or a `{{sessionCookie}}` from sign-in.

## Webhooks

- Payment gateway webhook is available at `POST /api/v1/payments/webhook`. This endpoint expects raw JSON (and in production you should verify gateway signatures). See `src/controllers/paymentController.ts` for raw-body handling details.

## Database (Prisma)

- Prisma schema and migrations live under the `prisma/` folder.
- To open Prisma Studio:

```bash
npx prisma studio
```

## Testing & CI

- Unit/e2e tests use `vitest` (see `tests/` folder). Run tests with:

```bash
pnpm test
# or: npm test
```

- You can run the Postman collection in CI using Newman. The repository contains `scripts/run_postman.sh` as a helper.

## Logging, Correlation IDs & Error Handling

- Structured logging is implemented with `pino` (see `src/utils/logger.ts`).
- A `correlationId` is attached to each request by the `requestContext` middleware and returned in error responses to aid debugging.
- Centralized error handling is in `src/middlewares/errorHandler.ts`.

## Troubleshooting

- If auth endpoints return `404`, confirm the app mounts Better Auth at `/api/auth` in `src/app.ts` and restart the server.
- If webhooks fail, ensure the request body is sent raw and any required signature headers are provided.

## Contributing

- Fork the repo, create a feature branch, add tests, and open a pull request.
- Keep DTOs in `src/dtos` as the source of truth for request validation; update `openapi.yaml` and `API_DOCS.md` when request/response shapes change.

## License

See the repository LICENSE file (if present) or add one before publishing.

## Contact / Support

For runtime issues include the `correlationId` from the response and a short description of the steps to reproduce.

---

Generated and tailored for the `ecommerce-full-stack` backend — contact the maintainer for further customizations.
