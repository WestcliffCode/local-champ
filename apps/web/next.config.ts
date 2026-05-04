import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Promoted out of experimental in Next.js 16.
  typedRoutes: true,
  // Workspace packages need transpilation in Next.js
  transpilePackages: [
    '@localgem/ui',
    '@localgem/db',
    '@localgem/logic',
    '@localgem/types',
  ],
};

export default withPayload(nextConfig);
