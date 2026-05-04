import {
  pgTable,
  uuid,
  smallint,
  text,
  timestamp,
  index,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { scouts } from './scouts';

/**
 * Reviews — in-app user-generated reviews of businesses.
 *
 * Distinct from `businesses.star_rating` and `businesses.review_count`, which
 * mirror Google Reviews aggregates. In-app reviews drive Scout Badge
 * progression (see thresholds in `@localgem/logic/scoring`).
 *
 * `business_id` references `businesses.id` (Payload-owned). FK constraint
 * added in Phase 1.C.
 *
 * One review per scout per business — `(scout_id, business_id)` is unique.
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scoutId: uuid('scout_id')
      .notNull()
      .references(() => scouts.id, { onDelete: 'cascade' }),
    /** FK to businesses.id (Payload-owned) — added in Phase 1.C. */
    businessId: uuid('business_id').notNull(),
    rating: smallint('rating').notNull(),
    body: text('body'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('reviews_business_idx').on(t.businessId),
    uniqueIndex('reviews_scout_business_idx').on(t.scoutId, t.businessId),
    check('reviews_rating_range', sql`${t.rating} between 1 and 5`),
  ],
);
