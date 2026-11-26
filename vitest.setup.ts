import nextEnv from "@next/env";

// Tests must never write to the application's Neon database by accident.
nextEnv.loadEnvConfig(process.cwd());
if (process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must be separate from the application database.");
}
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  delete process.env.DATABASE_URL;
}

// Isolated auth fixtures must not send real mail or use production secrets.
process.env.AUTH_SECRET = 'darkbyte-local-test-secret-not-for-production';
delete process.env.RESEND_API_KEY;
