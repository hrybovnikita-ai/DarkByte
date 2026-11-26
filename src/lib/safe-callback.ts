const ALLOWED = new Set(["/account", "/chat", "/admin", "/checkout/success"]);

/** Same-origin relative paths only — blocks open redirects. */
export function safeCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split("?")[0]?.split("#")[0] ?? "";
  if (ALLOWED.has(path) || path.startsWith("/chat/") || path.startsWith("/account")) {
    return raw;
  }
  return null;
}