/** Production HTTPS (Vercel) uses the Auth.js `__Secure-` session cookie prefix. */
export function secureAuthCookiesEnabled(): boolean {
  const base =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";
  if (base.startsWith("https://")) return true;
  if (process.env.VERCEL === "1") return true;
  return process.env.NODE_ENV === "production";
}