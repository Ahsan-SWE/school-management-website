import "dotenv/config";
import { defineConfig } from "prisma/config";

const localDatabaseUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export default defineConfig({
  schema: "database/prisma/schema.prisma",
  migrations: {
    path: "database/prisma/migrations",
    seed: "tsx database/prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? localDatabaseUrl,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
