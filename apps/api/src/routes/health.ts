import { HealthResponseSchema } from "@school-platform/contracts";
import { Hono } from "hono";

export const healthRoutes = new Hono().get("/", (c) => {
  const payload = HealthResponseSchema.parse({
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "development",
  });

  return c.json(payload, 200);
});
