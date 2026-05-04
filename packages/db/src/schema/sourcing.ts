import {
  pgTable,
  uuid,
  boolean,
  timestamp,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Sourcing — verified B2B "Local Loop" relationships.
 *
 * A directed edge `buyer → seller` indicating that the buyer business sources
 * goods/services from the seller business. When `verified = true`, both
 * businesses receive a +10 modifier to their `local_loop_score` (see
 * `@localgem/logic/scoring`).
 *
 * `buyer_id` and `seller_id` reference `businesses.id` (Payload-owned). FK
 * constraints added in Phase 1.C.
 */
export const sourcing = pgTable(
  'sourcing',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** FK to businesses.id (Payload-owned) — added in Phase 1.C. */
    buyerId: uuid('buyer_id').notNull(),
    /** FK to businesses.id (Payload-owned) — added in Phase 1.C. */
    sellerId: uuid('seller_id').notNull(),
    verified: boolean('verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('sourcing_pair_idx').on(t.buyerId, t.sellerId),
    check('sourcing_no_self_loop', sql`${t.buyerId} <> ${t.sellerId}`),
  ],
);
