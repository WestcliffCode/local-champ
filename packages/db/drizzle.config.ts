import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load env from the Next.js app's .env.local — the canonical location
// for DATABASE_URL and other secrets. The CWD-based dotenv/config import
// can't find it because Drizzle CLI runs from packages/db/, not apps/web/.
config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
  // Phase 1: introspect Payload-owned tables (businesses, coupons) into typed schema.
});
