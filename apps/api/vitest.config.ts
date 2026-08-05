import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      WEB_ORIGIN: "http://localhost:3000",
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_ANON_KEY: "test-publishable-key",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    },
  },
});
