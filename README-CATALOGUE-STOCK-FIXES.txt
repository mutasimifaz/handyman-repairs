HANDYMAN — CATALOGUE + STOCK FIXES

Updated files:
- src/components/ProductCard.jsx
  * Consistent product image frame with object-contain, stable card layout,
    clearer stock state, and aligned product information.
- src/pages/Products.jsx
  * Removed the conflicting featured-card column spanning. Catalogue now uses
    a consistent responsive 1 / 2 / 3 / 4-column grid.
- payment-worker/src/index.js
  * Webhook now verifies that the signed Stripe session ID, order reference,
    customer UID, amount, and currency match the stored order before fulfilment.
  * Stock and paid-order updates use Firestore commit writes with updateTime
    preconditions. This prevents concurrent webhook handlers from decrementing
    the same stock snapshot; a duplicate event sees the paid order and exits.
  * If inventory changed after checkout and is insufficient, stock is not made
    negative; the paid order is marked stock_conflict for manual review.

IMPORTANT:
- The .env file from the uploaded archive has intentionally NOT been included.
- Keep your existing local .env file private. Do not commit it or share it.
- .env.example is included as a template.
- No Cloudflare Worker secrets, Firebase service-account credentials, or Stripe
  secrets were changed. Existing Worker secrets remain configured separately.

DEPLOY:
1. Extract this project and copy your existing private .env into its root.
2. Install dependencies with: npm ci
3. Run: npm run build
4. Deploy the frontend using your existing hosting workflow.
5. Deploy the updated Worker from payment-worker using your existing Wrangler
   setup: npm install, then npx wrangler deploy.
6. Keep the existing Stripe webhook endpoint and secret configured.

TESTING NOTES:
- payment-worker/src/index.js passed `node --check`.
- A frontend production build could not be completed in this environment because
  the dependency installation did not finish and Vite was unavailable.
- Test in Stripe test mode before using live payments: successful payment,
  cancelled/expired checkout, repeated webhook delivery, two checkouts competing
  for the last item, and quantity greater than available stock.
- Check that the paid order is confirmed and stock decreases exactly once.
  For a stock_conflict order, review fulfilment/refund manually in Stripe.
