HANDYMAN REPAIRS — UPDATED FIX PATCH

Files included:
- payment-worker/src/index.js
- src/lib/data.js
- src/components/ProductCard.jsx
- src/pages/ProductDetail.jsx
- src/pages/Account.jsx
- src/pages/Products.jsx
- firestore.rules
- README-FIX-PATCH.txt

CHANGES
1. Stripe paid webhook updates order and stock atomically and avoids duplicate deductions on webhook retries. Stock conflicts are flagged for manual review; no automatic refund is issued.
2. Reviews are restricted to verified paid purchasers through the Worker endpoint; direct client review writes are denied by the included Firestore rules.
3. Customer order retrieval avoids a composite uid+createdAt index dependency.
4. Profile initialization preserves an existing profile role.
5. Product images use consistent frames without awkward cropping.
6. Account dashboard shows order history, paid/pending counts, refresh, and visible query errors.
7. Catalogue includes an editorial header, search, category filters, sorting, featured first product, and loading/error/empty states.

APPLY CAREFULLY
Back up your project. Merge files into matching paths; do not replace the entire project. Deploy the Worker from your payment-worker directory and keep all existing secrets/variables. Publish firestore.rules in Firebase Console. Commit and push frontend changes to GitHub; your connected hosting deployment should run automatically. Confirm VITE_PAYMENT_WORKER_URL still points to your existing Worker URL.

VERIFY BEFORE PRODUCTION
Run npm run build. In Stripe test mode, verify that a paid order appears in the customer account and stock decreases once; replaying the same webhook must not deduct stock again. Test review submission with an account that has a paid order for the product and one without. A stock_conflict means payment succeeded but inventory was insufficient; it requires prompt manual fulfilment/refund review. This patch is not proof of a successful live Stripe or Firestore test.
