import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/**
 * Drizzle client backed by the Supabase Postgres connection.
 *
 * Schema ownership:
 *   - Payload owns `businesses` and `coupons` tables (managed via Payload migrations).
 *   - Drizzle owns `redemptions`, `sourcing`, `scouts` (defined in `./schema`).
 *   - Drizzle introspects Payload-owned tables for type-safe reads.
 *
 * Use the Supabase pooler "Session" URI for `DATABASE_URL` so transactions work.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    '[@localgem/db] DATABASE_URL is not set — copy .env.example to .env.local and fill in Supabase credentials.',
  );
}

const queryClient = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
