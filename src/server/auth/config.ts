export function isAuthSecretConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export function isDatabaseAuthReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
}

export function isEmailServiceConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}

export function isAuthFullyConfigured(): boolean {
  return isAuthSecretConfigured() && isDatabaseAuthReady();
}

export function isNextAuthOperational(): boolean {
  return isAuthFullyConfigured();
}

export function authBaseUrl(): string {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}