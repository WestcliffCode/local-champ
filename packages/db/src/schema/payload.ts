/**
 * Hand-written Drizzle schemas for Payload-owned tables.
 *
 * These mirror the schema Payload's postgres adapter creates from the
 * collection configs in `apps/web/collections/`. They live here so Drizzle
 * can read businesses + coupons in pSEO routes with type safety, but they
 * are NOT the source of truth — Payload is.
 *
 * **Resync rule:** any time `apps/web/collections/Businesses.ts` or
 * `apps/web/collections/Coupons.ts` changes (or Payload generates a new
 * migration that alters these tables), update this file to match. The
 * migration journal at `apps/web/migrations/` is the canonical reference
 * for the actual column shape.
 *
 * Skipped fields that exist in Postgres but not in Drizzle:
 *   - `businesses.location` (geometry(Point, 4326)) — handled separately
 *     when geofencing lands; SELECT'd as NULL through Drizzle for now.
 */

import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  boolean,
  numeric,
  timestamp,
  customType,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

/**
 * `tsvector` is not a first-class Drizzle type. Define a custom type so
 * we can SELECT and reference the `businesses.search_tsv` generated column
 * in queries. Read-only on the Drizzle side — the column is always
 * computed by the database.
 */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});

/* -----------------------------------------------------------------------------
 * Enums (created by Payload)
 * --------------------------------------------------------------------------- */

export const businessStatusEnum = pgEnum('enum_businesses_status', [
  'unverified',
  'verified',
  'premium',
]);

export const userRoleEnum = pgEnum('enum_users_role', ['admin', 'merchant']);

/* -----------------------------------------------------------------------------
 * businesses (Payload collection)
 * --------------------------------------------------------------------------- */

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name').notNull(),
    slug: varchar('slug').notNull(),
    citySlug: varchar('city_slug').notNull(),
    categorySlug: varchar('category_slug').notNull(),
    status: businessStatusEnum('status').notNull().default('unverified'),
    isFranchise: boolean('is_franchise').default(false),
    addressStreet: varchar('address_street'),
    addressCity: varchar('address_city'),
    addressState: varchar('address_state'),
    addressPostalCode: varchar('address_postal_code'),
    // location: geometry(Point, 4326) — intentionally omitted. Payload writes
    // this column on its own (via @payloadcms/drizzle's geometryColumn helper).
    // Drizzle reads of `businesses` skip this column.
    phone: varchar('phone'),
    googlePlaceId: varchar('google_place_id'),
    starRating: numeric('star_rating'),
    reviewCount: numeric('review_count').default('0'),
    cpsScore: numeric('cps_score').default('0'),
    localLoopScore: numeric('local_loop_score').default('0'),
    /** Generated tsvector — created by migration 0003_cities_and_fts.sql.
     *  Read-only from Drizzle's perspective (database always computes it). */
    searchTsv: tsvector('search_tsv'),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('businesses_slug_unique_idx').on(t.slug),
    uniqueIndex('businesses_google_place_id_unique_idx').on(t.googlePlaceId),
    index('businesses_city_slug_idx').on(t.citySlug),
    index('businesses_category_slug_idx').on(t.categorySlug),
    index('businesses_status_idx').on(t.status),
    index('businesses_cps_score_idx').on(t.cpsScore),
  ],
);

/* -----------------------------------------------------------------------------
 * coupons (Payload collection)
 * --------------------------------------------------------------------------- */

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    title: varchar('title').notNull(),
    description: varchar('description'),
    discountValue: varchar('discount_value').notNull(),
    terms: varchar('terms'),
    isActive: boolean('is_active').default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('coupons_business_id_idx').on(t.businessId),
    index('coupons_is_active_idx').on(t.isActive),
  ],
);
