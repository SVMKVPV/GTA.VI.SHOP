# Stripe Checkout integration — disabled until launch readiness

This branch contains server-side Stripe Checkout scaffolding for Netlify. **No live payments are enabled.** Demo prices in app.js are not used by the server.

## Configure in Netlify (never commit secrets)
- `STRIPE_SECRET_KEY`: Stripe test secret key first, then a separate live key at launch.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret for `/.netlify/functions/stripe-webhook`.
- `STORE_BASE_URL`: actual HTTPS deployment origin.
- `STORE_PAYMENTS_ENABLED`: keep unset/false until all launch gates pass.

## Before enabling
1. Replace empty `approved-products.json` with vetted SKUs keyed by numeric frontend ID, each containing `name`, `unitAmount` (AUD cents), `approved:true`, `supplierVerified:true`, `fulfilmentVerified:true`, `marginApproved:true`, `resaleRightsVerified:true`. Calculate server-side profitability and verify Australian shipping, returns, tax and product compliance. Do not trust frontend prices.
2. Implement **durable idempotent order storage and webhook processing** before switching on payments. Current webhook intentionally responds 503 to paid events to prevent silent loss of orders; it is NOT a production fulfilment implementation. Store Stripe event IDs and session IDs uniquely; check payment_status and fulfil once.
3. Confirm shipping charges/tax (including GST applicability), legal policies, refund workflow, customer support and checkout totals.
4. Test successful, failed, cancelled, duplicate and asynchronous webhook events in Stripe test mode, plus refunds.
5. Confirm Stripe account ownership and payment destination. Keep live mode disabled until explicit owner review.

Webhook endpoint: `https://YOUR-DOMAIN/.netlify/functions/stripe-webhook`.
Stripe secret keys belong in Netlify environment variables, not GitHub or browser code.
