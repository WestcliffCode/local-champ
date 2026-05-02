-- Phase 4 D2: Add require_confirmation flag to coupons.
-- Payload-owned table \u2014 this SQL supplements Payload's migration system.

ALTER TABLE "coupons"
  ADD COLUMN IF NOT EXISTS "require_confirmation" boolean DEFAULT false;
