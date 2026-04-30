import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Workspace packages need transpilation in Next.js
  transpilePackages: [
    '@localchamp/ui',
    '@localchamp/db',
    '@localchamp/logic',
    '@localchamp/types',
  ],
};

export default nextConfig;
