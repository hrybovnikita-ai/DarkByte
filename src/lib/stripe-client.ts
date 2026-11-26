/** Client-safe publishable key (test mode only). */
export function stripePublishableKey() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!key?.startsWith("pk_test_")) return null;
  return key;
}