-- Phase 4 D1: Add redemption token + expiry to redemptions, phone to scouts.
--
-- Applied via Composio Supabase integration (not drizzle-kit migrator).
-- See packages/db/README.md for the migration workflow.

BEGIN;

-- Redemption token columns
ALTER TABLE "redemptions"
  ADD COLUMN IF NOT EXISTS "token" varchar,
  ADD COLUMN IF NOT EXISTS "expires_at" timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS "redemptions_token_unique" ON "redemptions" ("token");

-- Scout phone (optional, captured at first redemption via nudge)
-- Uses text to match the Drizzle schema definition in scouts.ts
ALTER TABLE "scouts"
  ADD COLUMN IF NOT EXISTS "phone" text;

COMMIT;
