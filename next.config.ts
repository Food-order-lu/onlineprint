import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Only use static export in production (for GitHub Pages)
  ...(isProd && { output: 'export' }),
  basePath: isProd ? '/Rivego' : '',
  assetPrefix: isProd ? '/Rivego/' : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
