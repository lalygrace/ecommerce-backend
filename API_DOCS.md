# API Documentation

Base URL (development): `http://localhost:3000`

All API endpoints are mounted under `/api/v1` except the auth handler which is mounted under `/api/auth/*` and the health endpoint:

- Health: `GET /health` (no auth)
- Auth: all auth routes are handled by Better Auth at `/api/auth/*` (see `src/app.ts` mounting)

Authentication

- This project uses Better Auth with JWT + Bearer token support. To call protected endpoints:
  - Obtain a JWT / Bearer token using the auth endpoints under `/api/auth/*` (register / sign-in endpoints are provided by Better Auth).
  - In Postman set the header `Authorization: Bearer {{token}}` (create an environment variable `{{token}}`).
  - Some endpoints may also accept cookie-based sessions; prefer Authorization header for API clients.

Postman quick setup

- Create an environment with:
  - `baseUrl` = `http://localhost:3000`
  - `token` = (leave blank; set after sign-in)
- Use request URLs like `{{baseUrl}}/api/v1/products`.
- Add a header `Authorization: Bearer {{token}}` for protected endpoints.

Notes on testing

- Webhook endpoints are public (no auth) — set their requests to no Authorization header when testing.
- Validation is performed by DTO schemas (zod). If you get a 400, check required fields and types in the DTOs under `src/dtos`.

## Endpoints

Users (`/api/v1/users`)

- POST `/api/v1/users` — Create user
  - Body: `CreateUserDto` (see `src/dtos/user.dto.ts`)
  - Example:
    ```json
    {
      "email": "alice@example.com",
      "password": "StrongPassw0rd!",
      "name": "Alice"
    }
    ```
- GET `/api/v1/users` — List users
  - Query: `page`, `limit`, `role`, `q` (see `ListUsersQuery`)
- GET `/api/v1/users/:id` — Get user by id
- PUT `/api/v1/users/:id` — Update user
  - Body: `UpdateUserDto`
- DELETE `/api/v1/users/:id` — Delete user

Auth (`/api/auth/*`)

- The Better Auth handler is mounted at `/api/auth/*` (see `src/app.ts`). Use those endpoints to register/log in and obtain tokens. Endpoints and payloads are provided by Better Auth.

Canonical Better Auth endpoints (observed in this dev instance)

- POST `/api/auth/sign-in/email` — Sign in with email/password (Better Auth email strategy).
  - Body: `{ "email": "...", "password": "..." }`
  - Example:
    ```bash
    curl -i -X POST http://localhost:3000/api/auth/sign-in/email \
      -H "Content-Type: application/json" \
      -d '{"email":"john@example.com","password":"StrongPassw0rd!"}'
    ```
  - Response: Better Auth may return a JSON body containing a token (e.g. `token`, `accessToken`, or a `data.session.accessToken`) or it may set a session cookie in `Set-Cookie`. Use whichever your instance returns.
  - In Postman: import the `postman_collection.json` included in the repo. The Sign In request is configured to capture either a `token` (saved to `{{token}}`) or a `sessionCookie` (saved to `{{sessionCookie}}`).

- Note: Some Better Auth installations expose alternate paths (e.g. `/api/auth/email/signin`, `/api/auth/signin`) — if one path returns `404`, try the `/api/auth/sign-in/email` variant which is the confirmed working path for this workspace.

Me (`/api/v1/me`)

- GET `/api/v1/me` — Returns the current session/user info
  - Requires a session token in headers. Example: `Authorization: Bearer {{token}}`.

Products (`/api/v1/products`)

- POST `/api/v1/products` — Create product (requires seller)
  - Auth: `requireSeller` middleware
  - Body: `CreateProductDto` (see `src/dtos/product.dto.ts`)
  - Example:
    ```json
    {
      "vendorId": "<vendor-id>",
      "title": "Nice shoes",
      "priceCents": 4999,
      "stock": 10,
      "image": "https://example.com/img.jpg"
    }
    ```
- GET `/api/v1/products` — List products
  - Query: pagination and filters (`q`, `vendorId`, `category`, `status`)
- GET `/api/v1/products/:id` — Get product by id
- PUT `/api/v1/products/:id` — Update product
  - Body: `UpdateProductDto`
- DELETE `/api/v1/products/:id` — Delete product

Sellers (`/api/v1/sellers`)

- POST `/api/v1/sellers` — Create seller
  - Body: `CreateSellerDto`
- GET `/api/v1/sellers/:id` — Get seller
- PUT `/api/v1/sellers/:id` — Update seller
  - Body: `UpdateSellerDto`
- DELETE `/api/v1/sellers/:id` — Delete seller

Vendors (`/api/v1/vendors`)

- POST `/api/v1/vendors` — Create vendor
  - Body: `CreateVendorDto`
- GET `/api/v1/vendors` — List vendors
- GET `/api/v1/vendors/:id` — Get vendor
- PUT `/api/v1/vendors/:id` — Update vendor
  - Body: `UpdateVendorDto`
- DELETE `/api/v1/vendors/:id` — Delete vendor

Categories (`/api/v1/categories`)

- POST `/api/v1/categories` — Create category
  - Body: `CreateCategoryDto`
  - Example:
    ```json
    { "name": "Footwear", "slug": "footwear" }
    ```
- GET `/api/v1/categories` — List categories (query: `page`, `limit`, `q`, `parentId`)
- GET `/api/v1/categories/:id` — Get category
- PUT `/api/v1/categories/:id` — Update category
  - Body: `UpdateCategoryDto`
- DELETE `/api/v1/categories/:id` — Delete category

Carts (`/api/v1/carts`)

- POST `/api/v1/carts` — Create cart
  - Body: `CreateCartDto` (optional `userId` or `sessionId`)
  - Example:
    ```json
    { "sessionId": "session-abc-123" }
    ```
- GET `/api/v1/carts/:id` — Get cart
- POST `/api/v1/carts/:id/items` — Add cart item
  - Body: `AddCartItemDto`
  - Example:
    ```json
    {
      "productId": "<product-id>",
      "title": "Nice shoes",
      "unitPriceCents": 4999,
      "quantity": 2,
      "image": "https://example.com/img.jpg"
    }
    ```
- PUT `/api/v1/carts/:id/items/:itemId` — Update cart item quantity
  - Body: `UpdateCartItemDto` (e.g. `{ "quantity": 1 }`)
- DELETE `/api/v1/carts/:id/items/:itemId` — Remove item
- DELETE `/api/v1/carts/:id` — Delete cart

Orders (`/api/v1/orders`)

- POST `/api/v1/orders` — Create order
  - Auth: `requireAuth` (customer or admin)
  - Body: `CreateOrderDto`
  - Example:
    ```json
    {
      "items": [
        {
          "productId": "<product-id>",
          "vendorId": "<vendor-id>",
          "title": "Nice shoes",
          "unitPriceCents": 4999,
          "quantity": 2
        }
      ],
      "totalCents": 9998,
      "shippingAddress": { "line1": "123 Main St", "city": "City" }
    }
    ```
- GET `/api/v1/orders` — List orders (Auth required)
  - Query: `page`, `limit`, `customerId`, `status`
- GET `/api/v1/orders/:id` — Get order (Auth + requireOrderOwner)
- PUT `/api/v1/orders/:id` — Update order (Auth + owner)
  - Body: `UpdateOrderDto`
- DELETE `/api/v1/orders/:id` — Delete order (Auth + owner)

Reviews (`/api/v1/reviews`)

- POST `/api/v1/reviews` — Create review (Auth required)
  - Body: `CreateReviewDto`
  - Example:
    ```json
    { "productId": "<product-id>", "rating": 5, "body": "Great!" }
    ```
- GET `/api/v1/reviews` — List reviews
  - Query: `page`, `limit`, `productId`, `userId`
- GET `/api/v1/reviews/:id` — Get review
- PUT `/api/v1/reviews/:id` — Update review (Auth + requireReviewOwner)
- DELETE `/api/v1/reviews/:id` — Delete review (Auth + owner)

Coupons (`/api/v1/coupons`)

- POST `/api/v1/coupons` — Create coupon (Auth + Admin required)
  - Body: `CreateCouponDto`
- GET `/api/v1/coupons` — List coupons
  - Query: `page`, `limit`, `active`
- GET `/api/v1/coupons/:id` — Get coupon
- PUT `/api/v1/coupons/:id` — Update coupon (Auth + Admin)
  - Body: `UpdateCouponDto`
- DELETE `/api/v1/coupons/:id` — Delete coupon (Auth + Admin)
- POST `/api/v1/coupons/validate` — Validate/apply coupon (public)
  - Body: `ApplyCouponDto` (code, totalCents, categorySlugs)

Payments (`/api/v1/payments`)

- POST `/api/v1/payments` — Create payment (Auth required)
  - Body: `CreatePaymentDto` (orderId, method, amountCents)
- POST `/api/v1/payments/webhook` — Webhook (public)
  - Body: `WebhookPaymentDto` — used for testing gateway updates; in production you should verify gateway signatures
- GET `/api/v1/payments/:id` — Get payment (Auth required)

Errors and status codes

- Validation errors return `400` with details from zod.
- Unauthorized access returns `401`.
- Forbidden (role mismatch or ownership check) returns `403`.
- Not found returns `404`.

Where to find schemas

- DTOs and schemas are in `src/dtos` (e.g., `src/dtos/product.dto.ts`, `user.dto.ts`). Use them as the source of truth for required fields and types.

Examples — Postman usage patterns

- Register / sign-in: import or call the relevant `/api/auth/*` endpoint, copy the returned token to `{{token}}`.
- Create a product (seller):
  - Set `Authorization` header.
  - POST `{{baseUrl}}/api/v1/products` with JSON body (see example above).
- Test webhook:
  - POST `{{baseUrl}}/api/v1/payments/webhook` with the `WebhookPaymentDto` JSON. No auth header required.

If you want, I can also:

- generate a Postman collection JSON (`postman_collection.json`) containing representative requests you can import, or
- produce a smaller OpenAPI spec (YAML/JSON) generated from the routes and DTOs for use with Swagger/Postman.

---

Generated from the route files in `src/routes` on inspection. If you want me to produce a Postman collection or an OpenAPI spec, tell me which you prefer and I'll generate it next.
