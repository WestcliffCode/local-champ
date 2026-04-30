-- Phase 1.A — RLS policies for Drizzle-owned tables.
--
-- Architecture reminder:
--   * Drizzle direct-postgres connections (DATABASE_URL pooler) bypass RLS.
--   * Server Actions running on the service role key bypass RLS.
--   * These policies gate the anon / authenticated roles only,
--     i.e. browser-side Supabase client calls.
--
-- Pattern: `auth.uid()` is the Supabase Auth user UUID. We resolve the
-- corresponding scout row via `scouts.auth_user_id = auth.uid()`.

-- =============================================================================
-- scouts
-- =============================================================================
ALTER TABLE "scouts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scouts_select_own" ON "scouts"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "scouts_update_own" ON "scouts"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- INSERT and DELETE on scouts go through Server Actions (service role).

-- =============================================================================
-- redemptions
-- =============================================================================
ALTER TABLE "redemptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "redemptions_select_own" ON "redemptions"
  FOR SELECT
  TO authenticated
  USING (
    scout_id IN (SELECT id FROM "scouts" WHERE auth_user_id = auth.uid())
  );

-- All writes via Server Action (service role).

-- =============================================================================
-- reviews
-- =============================================================================
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;

-- Reviews are public-read (rendered on business pages for everyone).
CREATE POLICY "reviews_select_all" ON "reviews"
  FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert_own" ON "reviews"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    scout_id IN (SELECT id FROM "scouts" WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "reviews_update_own" ON "reviews"
  FOR UPDATE
  TO authenticated
  USING (
    scout_id IN (SELECT id FROM "scouts" WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    scout_id IN (SELECT id FROM "scouts" WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "reviews_delete_own" ON "reviews"
  FOR DELETE
  TO authenticated
  USING (
    scout_id IN (SELECT id FROM "scouts" WHERE auth_user_id = auth.uid())
  );

-- =============================================================================
-- sourcing
-- =============================================================================
ALTER TABLE "sourcing" ENABLE ROW LEVEL SECURITY;

-- Verified sourcing edges are publicly visible (Local Loop badges on business pages).
CREATE POLICY "sourcing_select_verified" ON "sourcing"
  FOR SELECT
  USING (verified = true);

-- Writes flow through merchant Payload session, which uses service role and bypasses RLS.
-- Granular per-merchant policies can be added in Phase 3 once Supabase Auth covers merchants.
