const Stripe = require("stripe");
const response = (statusCode, body) => ({ statusCode, body });
async function storeOrder(event, session) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Order storage is not configured");
  const base = new URL(url);
  if (base.protocol !== "https:") throw new Error("Invalid storage URL");
  const record = {
    stripe_session_id: session.id,
    stripe_event_id: event.id,
    payment_status: session.payment_status,
    fulfilment_status: "pending_supplier",
    currency: session.currency || "aud",
    amount_total: session.amount_total
  };
  // First event for a session wins. Do not overwrite an already fulfilled order.
  const r = await fetch(new URL("/rest/v1/store_orders?on_conflict=stripe_session_id", base), {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(record)
  });
  if (!r.ok) throw new Error("Order storage failed: " + r.status);
}
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return response(405, "Method not allowed");
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return response(503, "Not configured");
  let signed;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    signed = stripe.webhooks.constructEvent(event.body, event.headers["stripe-signature"] || event.headers["Stripe-Signature"], process.env.STRIPE_WEBHOOK_SECRET, 300);
  } catch (_) { return response(400, "Invalid webhook signature"); }
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(signed.type)) {
    const session = signed.data.object;
    if (session.payment_status !== "paid") return response(200, "Payment pending");
    try { await storeOrder(signed, session); }
    catch (_) { return response(503, "Order persistence unavailable"); }
    // Supplier automation must operate on stored orders, never directly on a webhook.
    // Fulfilment stays pending until a vetted provider connector is configured.
  }
  return response(200, "received");
};
