import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use standalone output for production builds
  ...(process.env.NODE_ENV === "production" && { output: "standalone" }),
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
