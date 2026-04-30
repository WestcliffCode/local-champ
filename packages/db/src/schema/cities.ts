import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Cities — directory regions.
 *
 * Owned by Drizzle (not Payload) because:
 *   - The marketing home renders city cards directly from this table
 *   - City pages need display metadata that doesn't belong in `businesses`
 *   - Payload's CMS UX adds little value for a small ops-managed list
 *
 * `businesses.city_slug` references `cities.slug` by convention (no hard FK
 * yet — businesses is Payload-owned and adding a cross-ownership FK adds
 * setup-order constraints to seeding/migration. Revisit if integrity issues
 * surface.)
 *
 * RLS: public select on all rows; writes via service role only (admin ops).
 */
export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** URL slug, e.g. 'boulder'. Drives `/[city_slug]/...` routes. */
    slug: text('slug').notNull().unique(),
    /** Human-readable name for headers, e.g. 'Boulder'. */
    displayName: text('display_name').notNull(),
    /** State or province, e.g. 'Colorado'. */
    state: text('state').notNull(),
    /** Optional broader region for grouping, e.g. 'Front Range'. */
    region: text('region'),
    /** Hero photo for the marketing home city card and city landing page. */
    heroImageUrl: text('hero_image_url'),
    /** Whether to surface this city on the marketing home "find your city" grid. */
    featured: boolean('featured').notNull().default(false),
    /** Lower numbers appear first on the marketing home grid. */
    sortOrder: integer('sort_order').notNull().default(100),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('cities_featured_idx').on(t.featured),
    index('cities_sort_order_idx').on(t.sortOrder),
  ],
);
