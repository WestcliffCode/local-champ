-- LocalChamp dev/staging seed
--
-- Idempotent: safe to re-run. Uses ON CONFLICT DO NOTHING for every insert
-- so existing rows are never overwritten.
--
-- Apply via:
--   * Supabase SQL editor: paste this file in the dashboard
--   * psql: `psql "$DATABASE_URL" -f packages/db/scripts/seed.sql`
--
-- Coverage:
--   * 2 cities — Boulder, Asheville
--   * 10 businesses across 2 cities × 3 categories (coffee, florist, bookstore)
--   * 24 coupons spread across all businesses (~2-3 each)

-- =============================================================================
-- cities
-- =============================================================================
INSERT INTO "cities" ("slug", "display_name", "state", "region", "featured", "sort_order")
VALUES
  ('boulder',   'Boulder',   'Colorado',       'Front Range', true, 10),
  ('asheville', 'Asheville', 'North Carolina', 'Blue Ridge',  true, 20)
ON CONFLICT ("slug") DO NOTHING;

-- =============================================================================
-- businesses
-- =============================================================================
INSERT INTO "businesses"
  ("name", "slug", "city_slug", "category_slug", "status", "is_franchise",
   "address_city", "address_state", "star_rating", "review_count",
   "cps_score", "local_loop_score")
VALUES
  ('Flatiron Coffee Co',         'flatiron-coffee-co',         'boulder',   'coffee',    'verified', false, 'Boulder',   'CO', 4.7, 312, 45, 20),
  ('Pearl & Bean',               'pearl-and-bean',             'boulder',   'coffee',    'verified', false, 'Boulder',   'CO', 4.5, 187, 30, 10),
  ('Mountain Bloom Florists',    'mountain-bloom-florists',    'boulder',   'florist',   'verified', false, 'Boulder',   'CO', 4.8,  96, 25, 30),
  ('Boulder Page Books',         'boulder-page-books',         'boulder',   'bookstore', 'verified', false, 'Boulder',   'CO', 4.9, 421, 60, 20),
  ('Chautauqua Reading Room',    'chautauqua-reading-room',    'boulder',   'bookstore', 'verified', false, 'Boulder',   'CO', 4.6,  78, 35,  0),
  ('Blue Ridge Roasters',        'blue-ridge-roasters',        'asheville', 'coffee',    'verified', false, 'Asheville', 'NC', 4.7, 256, 50, 30),
  ('French Broad Brews',         'french-broad-brews',         'asheville', 'coffee',    'verified', false, 'Asheville', 'NC', 4.8, 198, 40, 20),
  ('Magnolia Petals',            'magnolia-petals',            'asheville', 'florist',   'verified', false, 'Asheville', 'NC', 4.6, 134, 20, 10),
  ('Asheville Books & Bindery',  'asheville-books-and-bindery','asheville', 'bookstore', 'verified', false, 'Asheville', 'NC', 4.9, 312, 55, 30),
  ('Battery Park Reading Co',    'battery-park-reading-co',    'asheville', 'bookstore', 'verified', false, 'Asheville', 'NC', 4.5,  87, 25,  0)
ON CONFLICT ("slug") DO NOTHING;

-- =============================================================================
-- coupons (joined back to businesses by slug)
-- =============================================================================
-- Coupons table has no unique constraint on (business_id, title), so a generic
-- `ON CONFLICT DO NOTHING` would only guard against PK collision (which can't
-- happen with gen_random_uuid()) and reruns would duplicate rows. Use
-- `WHERE NOT EXISTS` instead — skip rows where the (business, title) pair is
-- already seeded.
INSERT INTO "coupons" ("business_id", "title", "description", "discount_value", "terms", "is_active")
SELECT b."id", c."title", c."description", c."discount_value", c."terms", c."is_active"
FROM (VALUES
  ('flatiron-coffee-co',         'First-time visitor latte',     'One per scout. In-store only.',                          '$2 off any latte',         'Cannot combine with other offers.',                  true),
  ('flatiron-coffee-co',         'Pastry with any drink',         'Mornings only. Single use.',                             'Free pastry',              'With purchase of any drink before 11am.',           true),
  ('flatiron-coffee-co',         'Loyalty bean bag',              'For repeat scouts.',                                     '20% off whole-bean bags',  'Limit one bag per visit.',                          true),
  ('pearl-and-bean',             'Welcome to the neighborhood',   'For first-time scouts.',                                 'Free 8oz drip',            'Single use, in-store only.',                        true),
  ('pearl-and-bean',             'Afternoon pick-me-up',          NULL,                                                     '15% off afternoon drinks', 'Valid 1pm-5pm daily.',                              true),
  ('mountain-bloom-florists',    'Bouquet starter',                NULL,                                                     '$5 off bouquets $25+',     'In-store only. One per scout.',                     true),
  ('mountain-bloom-florists',    'Local-grown special',           'Highlights regional growers.',                           '20% off Colorado-grown',   'Selection varies by season.',                       true),
  ('boulder-page-books',         'New arrival discount',           NULL,                                                     '15% off any new release',  'In-store only. One per scout per visit.',           true),
  ('boulder-page-books',         'Used book bundle',              'Mix-and-match used.',                                    'Buy 3 used, get 1 free',   'Lowest priced item is free.',                       true),
  ('boulder-page-books',         'Champion the indie',             'For scouts with Bronze badge or higher.',                '$10 off $50',              'Show badge at checkout.',                           true),
  ('chautauqua-reading-room',    'Story-time supporter',           NULL,                                                     '10% off everything',       'Excludes magazines and gift cards.',                true),
  ('chautauqua-reading-room',    'Saturday morning special',       'Saturdays before noon.',                                 'Free coffee with book',    'With any book purchase.',                           true),
  ('blue-ridge-roasters',        'Hello Asheville',                'For first-time scouts.',                                 '$3 off pour-over',         'In-store only.',                                    true),
  ('blue-ridge-roasters',        'Bag of beans bonus',             NULL,                                                     '15% off whole-bean',       'Limit one bag per scout per month.',                true),
  ('blue-ridge-roasters',        'Local Loop partner',             'Sourced from Asheville Books & Bindery.',                'Free drink with book',     'Show receipt from same-day book purchase.',         true),
  ('french-broad-brews',         'Riverwalk welcome',              NULL,                                                     '20% off any drink',        'Single use. In-store only.',                        true),
  ('french-broad-brews',         'Mug club',                       'Bring your own mug.',                                    '$1 off refills',           'Daily, all day.',                                   true),
  ('magnolia-petals',            'Front porch bouquet',            'For scouts new to Asheville.',                           '$5 off your first arrangement', 'In-store only. One per scout.',                 true),
  ('magnolia-petals',            'Sunday flower drop',             'Pre-made arrangements, ready to go.',                    '25% off Sunday bouquets',  'Limited quantities.',                               true),
  ('asheville-books-and-bindery','Indie bookstore champion',       NULL,                                                     '15% off any title',        'Excludes special-order titles.',                    true),
  ('asheville-books-and-bindery','Bindery service trial',          'For repair, restoration, or custom binding.',            '20% off bindery service',  'By appointment.',                                   true),
  ('asheville-books-and-bindery','Local Loop partner',             'Sourced from Blue Ridge Roasters.',                      '$2 off any title',         'Show recent Blue Ridge receipt at checkout.',       true),
  ('battery-park-reading-co',    'Reading nook discount',          NULL,                                                     '$3 off any book',          'Single use, in-store only.',                        true),
  ('battery-park-reading-co',    'Children''s book sale',          NULL,                                                     '20% off children''s books','Excludes special-order.',                            true)
) AS c("business_slug", "title", "description", "discount_value", "terms", "is_active")
JOIN "businesses" b ON b."slug" = c."business_slug"
WHERE NOT EXISTS (
  SELECT 1
  FROM "coupons" existing
  WHERE existing."business_id" = b."id"
    AND existing."title" = c."title"
);
