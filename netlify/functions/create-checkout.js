const Stripe = require("stripe");
const catalog = require("../../approved-products.json");
const json = (statusCode, data) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(data) });
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  // Fail closed: demo products must never be charged.
  if (process.env.STORE_PAYMENTS_ENABLED !== "true" || !process.env.STRIPE_SECRET_KEY || !process.env.STORE_BASE_URL) return json(503, { error: "Checkout is not yet enabled. Products and fulfilment must be verified." });
  try {
    const body = JSON.parse(event.body || "{}");
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 25) return json(400, { error: "Invalid cart" });
    const items = body.items.map(item => {
      const id = String(item.id);
      const product = catalog[id];
      if (!product || product.approved !== true || !Number.isInteger(product.unitAmount) || product.unitAmount < 50 || !product.supplierVerified || !product.fulfilmentVerified || !product.marginApproved || !product.resaleRightsVerified) throw new Error("Product not approved for sale");
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) throw new Error("Invalid quantity");
      return { price_data: { currency: "aud", unit_amount: product.unitAmount, product_data: { name: product.name } }, quantity: item.qty };
    });
    const base = new URL(process.env.STORE_BASE_URL);
    if (base.protocol !== "https:") throw new Error("Invalid store URL");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment", line_items: items, billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["AU"] },
      success_url: new URL("/success.html?session_id={CHECKOUT_SESSION_ID}", base).toString(),
      cancel_url: new URL("/index.html", base).toString(),
      metadata: { store: "GTA.VI.SHOP", fulfilment: "manual_review_required" }
    });
    return json(200, { url: session.url });
  } catch (err) {
    return json(400, { error: "Checkout unavailable: verify the cart and approved product catalogue." });
  }
};
