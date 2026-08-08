import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, too small for a phone photo of an ID. Kept a
      // little above the app's own 8MB per-file cap (see
      // customers/[id]/documents-actions.ts) for multipart overhead.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
