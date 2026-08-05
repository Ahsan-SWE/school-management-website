import { z } from "zod";

const ApiEnvironmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export function getApiEnvironment() {
  return ApiEnvironmentSchema.parse(process.env);
}

const DatabaseEnvironmentSchema = z.object({
  DATABASE_URL: z.url(),
});

export function getDatabaseEnvironment() {
  return DatabaseEnvironmentSchema.parse(process.env);
}
