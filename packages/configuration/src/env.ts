import { z } from "zod";

const ApiEnvironmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.url(),
});

export function getApiEnvironment() {
  const environment = ApiEnvironmentSchema.parse(process.env);
  const supabasePublishableKey =
    environment.SUPABASE_PUBLISHABLE_KEY ?? environment.SUPABASE_ANON_KEY;

  if (!supabasePublishableKey) {
    throw new Error("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is required");
  }

  return {
    ...environment,
    SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  };
}

const DatabaseEnvironmentSchema = z.object({
  DATABASE_URL: z.url(),
});

export function getDatabaseEnvironment() {
  return DatabaseEnvironmentSchema.parse(process.env);
}
