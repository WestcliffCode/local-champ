import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 3 D3 — add `users.verified_phone`.
 *
 * Adds a nullable varchar column to the Payload `users` table for storing the
 * E.164 phone number that a merchant proved control of via Twilio Voice OTP
 * during the `/merchant/claim` flow. Indexed (non-unique) so the 1:1 phone
 * uniqueness lookup at claim time doesn't sequential-scan.
 *
 * **NOTE:** This migration was hand-curated to remove unintended schema drift
 * that `pnpm payload migrate:create` produced. The CLI also wanted to:
 *
 *   - Strip SRID 4326 from `businesses.location` (would break PostGIS
 *     distance/proximity queries that assume WGS 84).
 *   - Switch `coupons.business_id` FK from `ON DELETE cascade` to
 *     `ON DELETE set null` (would violate the column's NOT NULL constraint
 *     when a business is deleted, breaking deletes entirely).
 *
 * Both drifts are artifacts of `@payloadcms/db-postgres` version differences
 * between Phase 1.B and now — the current adapter generates different
 * defaults for `point` fields and relationship `onDelete`. The production DB
 * already has the correct values; the previous snapshot reflects them; we
 * keep this migration scoped to its actual intent. A separate cleanup PR
 * will fix the source-side mismatch in `Businesses.ts` and `Coupons.ts` so
 * future `migrate:create` runs produce clean diffs.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "verified_phone" varchar;
   CREATE INDEX IF NOT EXISTS "users_verified_phone_idx" ON "users" USING btree ("verified_phone");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "users_verified_phone_idx";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "verified_phone";`)
}