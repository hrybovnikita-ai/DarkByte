import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
process.env.VITEST_ALLOW_APP_DATABASE = "1";
process.env.AUTH_PROVIDER = "authjs";
process.env.NEXT_PUBLIC_AUTH_PROVIDER = "authjs";
delete process.env.CLERK_SECRET_KEY;
delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const files = [
  "__tests__/auth-integration.test.ts",
  "__tests__/credits-integration.test.ts",
  "__tests__/http-methods.test.ts",
  "__tests__/chat-api.test.ts",
  "__tests__/chat-stream-sse.test.ts",
];

const r = spawnSync("npx", ["vitest", "run", ...files], {
  stdio: "inherit",
  env: { ...process.env },
  shell: true,
});
process.exit(r.status ?? 1);