-- Phase 2.A — Cities table + FTS column on businesses.
--
-- Two unrelated changes bundled because they ship together in the same PR:
--   1. `cities` (Drizzle-owned) — directory region metadata for marketing
--      home and directory headers. Display name, state, region, hero image,
--      featured flag, sort order.
--   2. `businesses.search_tsv` — generated tsvector column powering Postgres
--      full-text search on the directory. GIN-indexed for fast match.
--
-- Payload doesn't need to know about either change. The cities table is
-- entirely Drizzle-owned (no Payload collection). The search_tsv column on
-- `businesses` is GENERATED ALWAYS AS ... STORED, so Payload's INSERTs
-- continue working untouched — Postgres computes the tsvector automatically
-- on every write.

-- =============================================================================
-- cities
-- =============================================================================
CREATE TABLE IF NOT EXISTS "cities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "display_name" text NOT NULL,
  "state" text NOT NULL,
  "region" text,
  "hero_image_url" text,
  "featured" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 100 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "cities_slug_unique" UNIQUE ("slug")
);

CREATE INDEX IF NOT EXISTS "cities_featured_idx" ON "cities" USING btree ("featured");
CREATE INDEX IF NOT EXISTS "cities_sort_order_idx" ON "cities" USING btree ("sort_order");

-- RLS: public select; writes via service role
ALTER TABLE "cities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cities_select_all" ON "cities"
  FOR SELECT
  USING (true);

-- =============================================================================
-- businesses.search_tsv (generated column for FTS)
-- =============================================================================
ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "search_tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce("name", '') || ' ' ||
      coalesce("category_slug", '') || ' ' ||
      coalesce("city_slug", '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS "businesses_search_tsv_idx"
  ON "businesses" USING GIN ("search_tsv");
