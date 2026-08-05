import { getApiEnvironment } from "@school-platform/configuration";
import { createLogger } from "@school-platform/observability";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { academicRoutes } from "./routes/academic";
import { healthRoutes } from "./routes/health";
import { meRoutes } from "./routes/me";
import { onboardingRoutes } from "./routes/onboarding";

const logger = createLogger({ service: "api" });
const environment = getApiEnvironment();

export const app = new Hono();

app.use("*", requestId());
app.use("*", secureHeaders());
app.use(
  "/api/*",
  cors({
    origin: environment.WEB_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "If-Match"],
    exposeHeaders: ["ETag", "X-Request-Id"],
    credentials: true,
  }),
);

app.use("*", async (context, next) => {
  const startedAt = performance.now();
  await next();

  logger.info("http_request", {
    method: context.req.method,
    path: new URL(context.req.url).pathname,
    status: context.res.status,
    durationMs: Math.round(performance.now() - startedAt),
    requestId: context.get("requestId"),
  });
});

app.get("/", (context) =>
  context.json({
    name: "school-platform-api",
    version: "v1",
    health: "/api/v1/health",
  }),
);

app.route("/api/v1/health", healthRoutes);
app.route("/api/v1/academic", academicRoutes);
app.route("/api/v1/me", meRoutes);
app.route("/api/v1/onboarding", onboardingRoutes);

app.notFound((context) =>
  context.json(
    {
      type: "https://school-platform.local/problems/not-found",
      title: "Resource not found",
      status: 404,
      requestId: context.get("requestId"),
    },
    404,
  ),
);

app.onError((error, context) => {
  logger.error("unhandled_error", {
    error: error instanceof Error ? error.message : "Unknown error",
    requestId: context.get("requestId"),
  });

  return context.json(
    {
      type: "https://school-platform.local/problems/internal-error",
      title: "Internal server error",
      status: 500,
      requestId: context.get("requestId"),
    },
    500,
  );
});

export type AppType = typeof app;
