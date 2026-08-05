import { createLogger } from "@school-platform/observability";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { healthRoutes } from "./routes/health";

const logger = createLogger({ service: "api" });

export const app = new Hono();

app.use("*", requestId());
app.use("*", secureHeaders());
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "If-Match"],
    exposeHeaders: ["ETag", "X-Request-Id"],
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  const startedAt = performance.now();
  await next();

  logger.info("http_request", {
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    durationMs: Math.round(performance.now() - startedAt),
    requestId: c.get("requestId"),
  });
});

app.get("/", (c) =>
  c.json({
    name: "school-platform-api",
    version: "v1",
    health: "/api/v1/health",
  }),
);

app.route("/api/v1/health", healthRoutes);

app.notFound((c) =>
  c.json(
    {
      type: "https://school-platform.local/problems/not-found",
      title: "Resource not found",
      status: 404,
      requestId: c.get("requestId"),
    },
    404,
  ),
);

app.onError((error, c) => {
  logger.error("unhandled_error", {
    error: error instanceof Error ? error.message : "Unknown error",
    requestId: c.get("requestId"),
  });

  return c.json(
    {
      type: "https://school-platform.local/problems/internal-error",
      title: "Internal server error",
      status: 500,
      requestId: c.get("requestId"),
    },
    500,
  );
});

export type AppType = typeof app;
