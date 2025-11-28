# Coding Guidelines for ecommerce-full-stack (Backend)

Purpose

- Provide a concise, enforceable set of rules for backend development.
- Reflect the user's preferences: structured code, separation of concerns, maintainability, and minimal files when sensible.

Core Principles

- Structure: Organize code into clear layers: `routes` -> `controllers` -> `services` -> `repositories` -> `models`.
- Single Responsibility: Each module/file should have one responsibility.
- Separation of Concerns: Keep HTTP, business, and persistence logic separate.
- Reusability: Prefer small, testable functions and services for reuse.
- Minimize Files Sensibly: Avoid splitting into files without purpose; prefer grouping related small functions together.
- Explicit Contracts: Use DTOs and schema validation (e.g., Zod) for request/response boundaries.
- Error Handling: Use a central `AppError` (operational errors) and a global error handler for consistent responses.
- Logging: Structured logs (e.g., `pino`) and do not log secrets.
- Security: Validate and sanitize inputs; use HTTPS, secure cookies, and environment-based secrets management.

TypeScript and Tooling

- Strict typing (`strict: true`) is required. Prefer well-typed APIs over `any`.
- Keep `tsconfig.json` conservative: `rootDir` -> `src`, `outDir` -> `dist`.
- Linting/Formatting: Use ESLint + Prettier with consistent rules. Fix linter errors before merging.

Testing

- Add unit tests for services and integration tests for key flows (auth, product CRUD, order flow).
- Tests must not rely on external services; use in-memory DB or test doubles where possible.

APIs and Design

- Version APIs (e.g., `/api/v1/...`) and document via OpenAPI or simple README.
- Use pagination, filtering, and sorting for list endpoints.
- Enforce role-based access control for vendors, customers, and admins.

Database

- Define clear ownership and relationships (e.g., Product -> Vendor, Order -> Customer + OrderItems).
- Use transactions where multiple related writes must be atomic.

Commits and PRs

- Small, focused commits with descriptive messages.
- PRs should include rationale and tests for behavioral changes.

Assistant Behavior (how I will help)

- I will analyze and challenge your suggestions against these guidelines.
- If you ask for a change that violates best practices, I will propose alternatives and explain trade-offs.
- I will prefer minimal, well-structured file additions and avoid unnecessary files.
- For every non-trivial change I make, I will include a short rationale in the commit message or patch.

When to Deviate

- Deviations are acceptable when they measurably improve clarity, reduce risk, or match real-world constraints — but they must be justified in the PR/commit.

If you'd like additions (CI, release process, performance budgets), tell me and I will extend this document.
