-- Phase 4 D1: Add redemption token + expiry to redemptions, phone to scouts.
--
-- Applied via Composio Supabase integration (not drizzle-kit migrator).
-- See packages/db/README.md for the migration workflow.

-- Redemption token columns
ALTER TABLE "redemptions"
  ADD COLUMN "token" varchar,
  ADD COLUMN "expires_at" timestamptz;

CREATE UNIQUE INDEX "redemptions_token_unique" ON "redemptions" ("token");

-- Scout phone (optional, captured at first redemption via nudge)
ALTER TABLE "scouts"
  ADD COLUMN "phone" varchar;
