# Clerk on Vercel preview only

Production (`darkbyte-olive.vercel.app`) stays on **Auth.js** until live Clerk keys, webhooks, and account linking are verified.

## Preview setup

1. Add Clerk **test** keys to `.env.local` (not committed).
2. Run: `node scripts/prepare-clerk-preview.mjs`
3. Redeploy a preview branch or open a PR — preview URLs use `AUTH_PROVIDER=clerk`.
4. Point Clerk dashboard webhooks at the **preview** deployment URL: `/api/webhooks/clerk`.

Production env vars `AUTH_PROVIDER` and `NEXT_PUBLIC_AUTH_PROVIDER` remain `authjs`.