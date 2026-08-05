import { serve } from "@hono/node-server";
import { getApiEnvironment } from "@school-platform/configuration";
import { app } from "./app";

const env = getApiEnvironment();

serve(
  {
    fetch: app.fetch,
    port: env.API_PORT,
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`);
  },
);
