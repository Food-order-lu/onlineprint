import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: This project uses dynamic API routes and cannot use static export
  // Deploy to Vercel, Netlify, or self-hosted Node.js server
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

