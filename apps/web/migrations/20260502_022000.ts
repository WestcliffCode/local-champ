import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 3 D3 review fix — promote `users.verified_phone` and
 * `users.business_id` indexes from non-unique to unique.
 *
 * Both columns are nullable. Postgres allows multiple NULLs in a unique
 * index by default (each NULL is treated as distinct), so existing rows
 * without verified_phone or without a business_id are unaffected.
 *
 * **Why:** the previous migration shipped these as non-unique because
 * the 1:1 invariants (one phone per merchant; one business per merchant)
 * were enforced only in the application layer. PR #12 reviewers
 * (Cubic + CodeRabbit) flagged the TOCTOU race between the
 * `findExistingBusinessClaim` / `findUserByVerifiedPhone` checks and
 * the `payload.update` call: two users completing claim concurrently
 * for the same business or with the same phone could both pass the
 * application-layer check and both succeed, with the second update
 * silently overwriting the first.
 *
 * Promoting to unique closes the race at the DB layer. The claim
 * Server Action now wraps `payload.update` in try/catch and maps
 * unique-constraint violations to the same humane "already claimed"
 * error the application-layer check would have produced.
 *
 * Pre-checked production for duplicates before applying:
 *   SELECT verified_phone, COUNT(*) FROM users
 *   WHERE verified_phone IS NOT NULL
 *   GROUP BY verified_phone HAVING COUNT(*) > 1;
 *   -- 0 rows
 *
 *   SELECT business_id, COUNT(*) FROM users
 *   WHERE business_id IS NOT NULL
 *   GROUP BY business_id HAVING COUNT(*) > 1;
 *   -- 0 rows
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "users_verified_phone_idx";
   CREATE UNIQUE INDEX IF NOT EXISTS "users_verified_phone_unique" ON "users" USING btree ("verified_phone");
   DROP INDEX IF EXISTS "users_business_idx";
   CREATE UNIQUE INDEX IF NOT EXISTS "users_business_id_unique" ON "users" USING btree ("business_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "users_business_id_unique";
   CREATE INDEX IF NOT EXISTS "users_business_idx" ON "users" USING btree ("business_id");
   DROP INDEX IF EXISTS "users_verified_phone_unique";
   CREATE INDEX IF NOT EXISTS "users_verified_phone_idx" ON "users" USING btree ("verified_phone");`)
}
