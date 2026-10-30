# HandyMan payment-only Cloudflare Worker (starter)

This is a separate, serverless payment service. It does not replace the React app or Firestore.

## Important eligibility note

Do not deploy this to accept payments unless the Stripe account is legitimately eligible for the account country and ownership. Stripe currently does not list Bangladesh as a supported country for standard merchant accounts. This code is a technical starter, not a way around Stripe's country or age requirements. Keep all testing in test mode and involve a parent/guardian where account ownership or financial services require an adult.

## What it does

- Accepts a signed-in Firebase user's checkout request.
- Looks up the product in Firestore so the browser cannot choose its own price.
- Creates a pending Firestore order.
- Creates a Stripe Checkout Session using a server-side secret.
- Verifies Stripe webhook signatures before marking an order paid/confirmed.
- Uses Firestore through the Google REST API; no always-on Node server.

## Prerequisites

- Existing Firebase project with Firestore and Authentication.
- A Stripe account eligible to use the requested payment functionality.
- Cloudflare account.
- Node.js installed locally only to run Wrangler/deploy the Worker; no Node server runs 24/7.

## Configure

1. Install dependencies in this folder: `npm install`.
2. Edit `wrangler.toml`: set `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGIN`, and `CURRENCY`.
3. Set `FRONTEND_URL` as a Worker secret to your frontend origin (for local development, `http://localhost:5173`).
4. Set secrets (never commit them):

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put FIREBASE_WEB_API_KEY
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON
npx wrangler secret put FRONTEND_URL
```

`FIREBASE_SERVICE_ACCOUNT_JSON` is the complete JSON key for a service account with Firestore access. Treat it like a password. Do not put it in the frontend or GitHub. Prefer a dedicated service account with only the required Firestore permissions. If you are not comfortable creating a service account, stop and ask before proceeding.

5. Run locally with `npm run dev`; deploy with `npm run deploy` only after configuration and account eligibility are confirmed.
6. In Stripe's developer dashboard, register `https://YOUR-WORKER.workers.dev/webhook` for `checkout.session.completed` and `checkout.session.expired`, then save the signing secret as `STRIPE_WEBHOOK_SECRET`.

## Endpoints

- `POST /create-checkout-session` — requires `Authorization: Bearer <Firebase ID token>` and JSON `{ "productId": "...", "quantity": 1 }`.
- `POST /webhook` — Stripe webhook endpoint; signature-verified.

## Important integration notes

- The frontend must call the Worker with `await auth.currentUser.getIdToken()` and redirect to the returned `url`.
- The frontend must stop writing paid/confirmed order status itself. Only the verified webhook should do that.
- `CURRENCY` and product price units must match your actual Stripe account/payment configuration. The starter currently uses the product's numeric `price` as the major currency amount. Do not deploy with a currency mismatch.
- Stripe checkout availability and supported currencies depend on the merchant account and country. A Bangladesh-based user should not choose another country unless they genuinely meet that country's legal/business requirements.
- This starter has not been deployed against your Firebase/Stripe accounts. Configure and test it in a separate branch/project first.
