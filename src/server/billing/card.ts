const BRANDS = new Set(["visa", "mastercard", "amex", "discover", "diners", "jcb", "unionpay", "unknown"]);

export type SafeCard = { brand: string; last4: string };

/** Keeps brand and last4 only. Full card numbers and CVC values are discarded. */
export function sanitizeCard(brand: unknown, last4: unknown): SafeCard | null {
  if (typeof brand !== "string" || typeof last4 !== "string") return null;
  const normalized = brand.toLowerCase();
  if (!BRANDS.has(normalized) || !/^[0-9]{4}$/.test(last4)) return null;
  return { brand: normalized, last4 };
}

export function sanitizeFailureCode(value: unknown) {
  if (typeof value !== "string") return null;
  return /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : null;
}

export function containsPrimaryAccountNumber(value: string) {
  return /\d(?:[ -]*\d){12,18}/.test(value);
}
