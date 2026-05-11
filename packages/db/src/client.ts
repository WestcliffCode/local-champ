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
 *
 * ## Lazy initialization
 *
 * The client is created on first access rather than at module load time.
 * This lets `@localgem/db` be imported during `next build` without
 * requiring `DATABASE_URL` in the environment — the build compiles and
 * bundles the module but never executes a query, so the connection is
 * never opened. At runtime (dev/prod), the first query triggers
 * initialization and any missing env var is caught immediately.
 */

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
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

    _db = drizzle(queryClient, { schema });
  }
  return _db;
}

/**
 * Lazy-initialized Drizzle database instance.
 *
 * Uses a Proxy so callers can use `db.select(...)`, `db.insert(...)`, etc.
 * exactly as before — the real Drizzle instance is created on first property
 * access. If `DATABASE_URL` is missing at that point, it throws with a
 * helpful error message.
 */
export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop, receiver) {
      const real = getDb();
      const value = Reflect.get(real, prop, receiver);
      return typeof value === 'function' ? value.bind(real) : value;
    },
  },
);

export type Database = typeof db;
