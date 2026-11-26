import nextEnv from "@next/env";
import { vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
  isAuthProvidersConfigured: () => true,
}));

// Tests must never write to the application's Neon database by accident.
nextEnv.loadEnvConfig(process.cwd());
if (
  process.env.TEST_DATABASE_URL &&
  process.env.TEST_DATABASE_URL === process.env.DATABASE_URL &&
  process.env.VITEST_ALLOW_APP_DATABASE !== "1"
) {
  throw new Error("TEST_DATABASE_URL must be separate from the application database.");
}
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  delete process.env.DATABASE_URL;
}

// Isolated auth fixtures must not send real mail or use production secrets.
process.env.AUTH_SECRET = 'darkbyte-local-test-secret-not-for-production';
process.env.AUTH_PROVIDER = 'authjs';
process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'authjs';
delete process.env.CLERK_SECRET_KEY;
delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
delete process.env.RESEND_API_KEY;
