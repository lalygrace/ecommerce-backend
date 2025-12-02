# Coding Guidelines — Backend

Purpose

- Capture the project's standards so code is: structured, maintainable, testable, and minimal in files where sensible.
- Ensure the assistant critiques and validates design choices against professional engineering practices.

Core Principles

- **Structure:** Follow a layered approach: `routes` → `controllers` → `services` → `repositories` → `models`.
- **Single Responsibility:** One responsibility per module/file.
- **Separation of Concerns:** Keep HTTP, business logic, and persistence separate.
- **Reusability:** Prefer small, pure, testable functions. Share common logic via well-scoped utilities.
- **Minimal Files (sensible):** Avoid creating files without clear responsibility. Group small related helpers into a single file when appropriate.
- **Explicit Contracts:** Use DTOs and runtime validation (e.g. `zod`) for request/response boundaries.
- **Robust Error Handling:** Use typed operational errors (e.g. `AppError`) and a single global error middleware that maps to HTTP responses.
- **Observability:** Structured logs (e.g. `pino`), correlation IDs, and avoid logging secrets.
- **Security-by-Design:** Validate, sanitize, use least privilege, store secrets in env, and follow OWASP guidance.

Project Layout (recommended)

Keep the layout simple and predictable. Example for this repository:

- `src/routes/` : Route definitions and basic request -> controller wiring.
- `src/controllers/` : Parse request, call `services`, transform responses.
- `src/services/` : Business logic, orchestration, validations beyond DTOs.
- `src/repositories/` : Database access, plain queries, and transactions.
- `src/models/` : Domain types and prisma client wrappers (if using Prisma).
- `src/dtos/` : Request/response schemas and `zod` validators.
- `src/middlewares/` : Express/Koa middlewares (auth, error handling, request validation).
- `src/utils/` : Small, focused helpers used across layers.

Code Rules (concrete)

- **Controllers:** Thin wrappers. Do not contain business logic. Example:
  - Controller: parse/validate request (use DTO), call service, handle response status.

- **Services:** Implement business rules. Use dependency injection where helpful for testability.
- **Repositories:** Only data persistence. Return domain objects/DTOs, not HTTP responses.
- **Files:** Aim for 1–200 lines per file. If a file grows beyond that, consider extracting cohesive pieces.
- **Exports:** Prefer a single default export for modules that represent a concept; otherwise named exports for utilities.
- **Avoid `any`:** Use explicit types or generics. Narrow types at boundaries.

Error Handling

- Centralize errors in `src/errors/AppError.ts` with an `isOperational` flag and an HTTP status code.
- Throw `AppError` for expected conditions (validation, auth, not found). Let unexpected exceptions bubble to the global error handler and return a 500.
- Global error middleware maps `AppError` → HTTP status and sanitized message; logs full details internally.
- Example shape:

```ts
class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}
```

Validation and DTOs

- Use `zod` or similar for runtime validation in `src/dtos/` and reuse those schemas to infer TypeScript types.
- Validate at the edge (route/controller) and keep services defensive.

Logging & Observability

- Use structured JSON logs (e.g., `pino`). Include correlation/request IDs when available.
- Log at appropriate levels: `debug`, `info`, `warn`, `error`.
- Do not log secrets or full request bodies in production.

Testing

- Unit tests: `services`, `utils`, and `repositories` (mock DB access).
- Integration tests: critical flows (auth, checkout). Use test DB or in-memory DB and reset state between tests.
- Keep tests fast and deterministic.

Linting, Formatting, and Tooling

- Required dev dependencies (suggested): `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `husky`, `lint-staged`, `zod`, `pino`.
- `tsconfig.json`: `strict: true`, `noImplicitAny: true`, `forceConsistentCasingInFileNames: true`.
- Example `package.json` scripts:

```json
"scripts": {
	"lint": "eslint 'src/**/*.{ts,tsx}' --fix",
	"format": "prettier --write 'src/**/*.{ts,tsx,md,json}'",
	"test": "vitest --run"
}
```

- Use `husky` + `lint-staged` to run `eslint` and `prettier` on staged files.

Code Reviews and the Assistant

- The assistant must not uncritically accept requests. For design or implementation changes the assistant will:
  1.  Analyze the proposed change and list pros/cons.
  2.  Suggest alternatives aligned with these guidelines.
  3.  Implement the preferred option after confirmation or when the change is clearly correct.

Practical Examples (patterns)

- Controller → Service → Repository flow (pseudo):

```ts
// controller
const createProduct = async (req, res, next) => {
  const data = CreateProductDto.parse(req.body);
  const product = await productService.create(data);
  res.status(201).json(product);
};

// service
const create = async (data) => {
  // business rules, pricing, validation beyond DTO
  return repository.create(data);
};

// repository
const create = async (row) => prisma.product.create({ data: row });
```

Acceptance Criteria (for PRs / features)

- Code follows the layer separation and file/line heuristics.
- All new runtime inputs validated via DTOs.
- Errors use `AppError` for expected failure modes.
- Linting and formatting pass locally and in CI.
- Unit tests added for core business logic; integration test added for main flow.

When To Create New Files

- Create a new file when a responsibility is distinct, reused in multiple places, or would make a file >200 lines.
- Prefer a single file for small, closely related helpers used only by one module.
