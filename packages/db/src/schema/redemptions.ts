import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { redemptionStatusEnum } from './enums';
import { scouts } from './scouts';

/**
 * Redemptions — deterministic attribution of scout → coupon.
 *
 * `coupon_id` references `coupons.id` (Payload-owned). The hard FK constraint
 * is added in a follow-up migration (1.C) once Payload has created its tables;
 * for now the column is a plain UUID and we enforce relationship integrity
 * at the application layer.
 *
 * RLS: scouts can read their own redemptions. Writes go through Server
 * Actions on the service role.
 */
export const redemptions = pgTable(
  'redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scoutId: uuid('scout_id')
      .notNull()
      .references(() => scouts.id, { onDelete: 'cascade' }),
    /** FK to coupons.id (Payload-owned) — constraint added in Phase 1.C. */
    couponId: uuid('coupon_id').notNull(),
    status: redemptionStatusEnum('status').notNull().default('pending'),
    /** HMAC-signed redemption token for tap-to-redeem (Phase 4). */
    token: varchar('token'),
    /** When the 5-minute redemption window closes. */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('redemptions_scout_idx').on(t.scoutId),
    index('redemptions_coupon_idx').on(t.couponId),
    index('redemptions_status_idx').on(t.status),
    uniqueIndex('redemptions_token_unique').on(t.token),
  ],
);
