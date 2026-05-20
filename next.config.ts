import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase the body size limit for image uploads (default is 4 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
