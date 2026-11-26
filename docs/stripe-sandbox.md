# Stripe sandbox billing (DARKBYTE)

This app only accepts **Stripe test mode**. Live keys (`sk_live_`, `pk_live_`) refuse checkout and webhooks.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server API key (`sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client key (`pk_test_…`) for future Stripe.js use |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from `stripe listen` or the test dashboard (`whsec_…`) |
| `STRIPE_PRICE_IDS` | JSON map of six recurring **test** Price IDs |
| `RESEND_API_KEY` | Sends `[TEST PAYMENT]` subscription receipts |
| `BILLING_FROM_EMAIL` | From address for billing mail (defaults to `AUTH_EMAIL_FROM`) |
| `CREDITS_APP_URL` | Public origin for Checkout return URLs (e.g. `http://localhost:3000`) |

Never commit real secrets. Copy values from `.env.example` into `.env.local` only.

## `STRIPE_PRICE_IDS` format

Create six **recurring** Prices in the Stripe test dashboard that match [subscription-plans.ts](../src/lib/subscription-plans.ts):

```json
{
  "starter_month": "price_…",
  "starter_year": "price_…",
  "pro_month": "price_…",
  "pro_year": "price_…",
  "ultimate_month": "price_…",
  "ultimate_year": "price_…"
}
```

Amounts must match the catalog (e.g. Pro monthly = $15.00 USD).

## API routes

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/stripe/checkout` | Start subscription Checkout (auth + idempotency key) |
| `POST` | `/api/stripe/webhook` | Stripe-signed webhooks |
| `GET` | `/api/billing/status` | Subscription + payment history |
| `POST` | `/api/credits/checkout` | One-time credit packs (unchanged) |

## Local webhook forwarding

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the displayed `whsec_…` value into `STRIPE_WEBHOOK_SECRET`.

## Test cards (sandbox)

| Card | Result |
| --- | --- |
| `4242424242424242` | Visa success |
| `5555555555554444` | Mastercard success |
| `4000000000000002` | Decline |

Use expiry `12/29`, CVC `123`, any billing email on the Stripe hosted page.

## Apple Pay / Google Pay

Wallets appear on Stripe Checkout when the browser and Stripe test dashboard support them. No card data is stored in DARKBYTE — only brand and last four after payment.