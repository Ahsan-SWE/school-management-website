import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@school-platform/contracts", "@school-platform/ui-web"],
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
