import { resolve } from "node:path";
import { config as loadEnvironment } from "dotenv";
import type { NextConfig } from "next";

loadEnvironment({
  path: resolve(process.cwd(), "../../.env"),
  quiet: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@school-platform/contracts", "@school-platform/ui-web"],
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
