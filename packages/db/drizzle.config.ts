import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load env from the Next.js app's .env.local — the canonical location
// for DATABASE_URL and other secrets. The CWD-based dotenv/config import
// can't find it because Drizzle CLI runs from packages/db/, not apps/web/.
const envResult = config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });
if (envResult.error) {
  throw new Error(
    `[drizzle.config] Failed to load apps/web/.env.local: ${envResult.error.message}\n` +
    'Hint: cp apps/web/.env.example apps/web/.env.local and fill in the credentials.',
  );
}

import { defineConfig } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    '[drizzle.config] DATABASE_URL is not set. Ensure apps/web/.env.local contains the Supabase pooler "Session" URI.',
  );
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
  // Phase 1: introspect Payload-owned tables (businesses, coupons) into typed schema.
});
