import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  // This integration deliberately cannot accept live payments.
  if (!key?.startsWith("sk_test_")) throw new Error("PAYMENTS_NOT_CONFIGURED");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000 });
}

export function checkoutOrigin() {
  const value = process.env.CREDITS_APP_URL ?? process.env.AUTH_URL;
  if (!value) throw new Error("PAYMENTS_NOT_CONFIGURED");
  const url = new URL(value);
  if (url.username || url.password || (url.protocol !== "https:" &&
    !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) {
    throw new Error("PAYMENTS_NOT_CONFIGURED");
  }
  return url.origin;
}
