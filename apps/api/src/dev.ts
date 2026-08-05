import { resolve } from "node:path";
import { config as loadEnvironment } from "dotenv";

loadEnvironment({
  path: resolve(process.cwd(), "../../.env"),
  quiet: true,
});

const [{ getApiEnvironment }, { serve }, { app }] = await Promise.all([
  import("@school-platform/configuration"),
  import("@hono/node-server"),
  import("./app"),
]);

const environment = getApiEnvironment();

serve(
  {
    fetch: app.fetch,
    port: environment.API_PORT,
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`);
  },
);
