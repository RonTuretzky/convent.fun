import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@convent/db", "@convent/ui"],
};

export default nextConfig;
