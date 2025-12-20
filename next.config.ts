import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/Rivego' : '',
  assetPrefix: isProd ? '/Rivego/' : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
