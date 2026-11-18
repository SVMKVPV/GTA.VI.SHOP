# BLVCK OAK Stripe + GTA.VI.SHOP fulfilment

## Confirmed payment account
The connected Stripe account named **blvck-oak sandbox** is in **test mode**. No live Stripe account was confirmed; do not enable production checkout yet.

## Workflow implemented
1. Server creates Stripe Checkout Sessions from an allowlist of verified products.
2. Stripe signs a payment event.
3. Webhook verifies signature, checks paid status and persists the order to a private Supabase table.
4. Duplicate Stripe session IDs are ignored without resetting an order's fulfilment state.
5. Orders remain `pending_supplier` until an authorised fulfilment worker and provider integration exist.

## Not yet implemented
- DSers / AliExpress supplier API authorisation and actual supplier order placement. No verified automated ordering API or supplier credentials are connected.
- Inventory/variant mappings, shipping costs, cancellation, tracking callbacks and customer notifications.
- Production-ready fulfilment worker, order reconciliation and retry monitoring.
- Verified product margins, supplier permissions and actual customer support/returns workflow.

## Setup
1. Select the correct Supabase project; run `supabase/fulfilment.sql` with approval.
2. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `STORE_BASE_URL` in Netlify. Never commit secrets.
3. Keep `STORE_PAYMENTS_ENABLED` unset or false.
4. Connect an approved supplier/order integration and create a scheduled worker that claims pending orders, records supplier order IDs, and retries safely.
5. Test payment success, failed payment, duplicate/out-of-order webhook delivery, supplier rejection, refunds, tracking and reconciliation before enabling live payments.

## Important
The Stripe payment account is BLVCK OAK **sandbox**, not verified live processing. Never treat an AliExpress product link as authorisation for automatic ordering. No fulfilment is currently automatic.
