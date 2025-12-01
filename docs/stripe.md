# Stripe integration (local dev)

This document explains how to exercise the Stripe integration locally and includes a small helper script to create and confirm a PaymentIntent that will trigger a signed webhook to your app.

Prerequisites

- Node.js and pnpm installed
- The project dependencies installed (`pnpm install`)
- Your `.env` contains the following keys (test keys):

```
STRIPE_SECRET_KEY=sk_test_...   # from Stripe Dashboard -> Developers -> API keys
STRIPE_WEBHOOK_SECRET=whsec_...  # from `stripe listen` or Dashboard webhook endpoint
```

Do NOT commit your `.env` to git.

1. Install Stripe CLI (optional but recommended for local webhook testing)

- Official docs: https://stripe.com/docs/stripe-cli
- Windows: use the official installer on the page or use `choco install stripe` (if you have Chocolatey).

Validate installation:

```bash
stripe --version
```

2. Start your server

```bash
pnpm install
pnpm dev
# server should respond on http://localhost:3000
curl http://localhost:3000/health
```

3. Start forwarding Stripe webhooks to your local server (in another terminal)

```bash
stripe listen --forward-to localhost:3000/api/v1/payments/webhook
```

- The CLI will print a webhook signing secret `whsec_...`. Copy it and ensure it matches `STRIPE_WEBHOOK_SECRET` in your `.env`. If it differs, update `.env` and restart the server.

4. Create a test `User` and `Order` (quickest with Prisma Studio)

```bash
pnpm prisma studio
```

- Create a `User` record.
- Create an `Order` record and set `customerId` to the `user.id` and `totalCents` (e.g., 1500).
- Copy the `order.id`.

5. Use the helper script to create and confirm a PaymentIntent

- This script creates a PaymentIntent with metadata `orderId` and confirms it with the test card `pm_card_visa` so Stripe will send a `payment_intent.succeeded` webhook.

Usage:

```bash
# from project root
node scripts/confirm_payment.js <orderId> [amountCents]
# example
node scripts/confirm_payment.js or_123abc 1500
```

- The script will print the PaymentIntent id and final status.

6. Verify behavior

- Observe your server logs to confirm webhook was received and processed.
- Check Prisma Studio to confirm:
  - A `Payment` record exists with `orderId` and `transactionRef` equal to the PaymentIntent id.
  - `Payment.status` is `PAID` and `Order.status` is `PROCESSING`.
  - Reservations for the order items were consumed (if applicable).

Manual fallback (no Stripe CLI):

- If you cannot run Stripe CLI, you can still test the JSON webhook fallback (this skips signature verification):

```bash
curl -X POST http://localhost:3000/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>","status":"PAID","transactionRef":"manual-test","gateway":"stripe","amountCents":1500}'
```

Security notes

- Use test keys in development. Use production (live) keys only on production systems.
- Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secret. Store them in environment variables or secret management in your hosting provider.
- Do not hardcode secrets into repo.

Support

- If the webhook signature verification fails, ensure the `STRIPE_WEBHOOK_SECRET` matches the secret printed by `stripe listen`.
- If `stripe` command isn't found, install the Stripe CLI per step 1.

---

Generated helper script: `scripts/confirm_payment.js` (usage shown above)
