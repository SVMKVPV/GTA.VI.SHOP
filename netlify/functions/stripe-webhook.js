const Stripe = require("stripe");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return { statusCode: 503, body: "Not configured" };
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const signed = stripe.webhooks.constructEvent(event.body, event.headers["stripe-signature"] || event.headers["Stripe-Signature"], process.env.STRIPE_WEBHOOK_SECRET, 300);
    // Do not acknowledge a paid order as fulfilled. Production launch requires
    // durable, idempotent order persistence + an authenticated fulfilment workflow.
    if (["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(signed.type)) {
      console.info("Stripe event received for manual review", { eventId: signed.id, sessionId: signed.data.object.id, paymentStatus: signed.data.object.payment_status });
      return { statusCode: 503, body: "Order processing not yet configured" };
    }
    return { statusCode: 200, body: "received" };
  } catch (_) {
    return { statusCode: 400, body: "Invalid webhook signature" };
  }
};
