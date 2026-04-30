-- Phase 1.C — FK constraints from Drizzle-owned tables to Payload-owned tables,
-- plus PostGIS SRID enforcement on businesses.location.
--
-- These were deferred from Phase 1.A because the target tables (`businesses`,
-- `coupons`) didn't exist yet. Payload's first migration (Phase 1.B) creates
-- those tables; this migration wires the relationships.
--
-- ON DELETE strategy per relationship:
--   * redemptions.coupon_id → coupons.id: RESTRICT
--       Redemption history has analytical and audit value; we never want a
--       merchant deleting a coupon to silently erase the record of who
--       redeemed it. Merchants should deactivate (is_active=false) instead
--       of deleting. RESTRICT blocks the coupon delete until redemptions
--       are cleared (which should be a deliberate admin operation).
--   * sourcing.{buyer,seller}_id → businesses.id: CASCADE
--       A sourcing edge has no meaning without both endpoints. If a business
--       is hard-deleted (rare — usually we'd archive instead), the edge goes
--       with it.
--   * reviews.business_id → businesses.id: CASCADE
--       Same reasoning: a review without a subject business is orphaned data.

ALTER TABLE "redemptions"
  ADD CONSTRAINT "redemptions_coupon_id_coupons_id_fk"
  FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "sourcing"
  ADD CONSTRAINT "sourcing_buyer_id_businesses_id_fk"
  FOREIGN KEY ("buyer_id") REFERENCES "public"."businesses"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "sourcing"
  ADD CONSTRAINT "sourcing_seller_id_businesses_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "public"."businesses"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- Enforce SRID 4326 (WGS84 lat/lng) on businesses.location.
--
-- Payload's drizzle helper (geometryColumn.js in @payloadcms/drizzle) writes
-- inserts as `SRID=4326;point(lng lat)` already, so this constraint matches
-- runtime behavior and prevents silent insertion of points in other coordinate
-- systems. Without the constraint, the column accepts any SRID, which would
-- corrupt geofencing math downstream.
ALTER TABLE "businesses"
  ALTER COLUMN "location" TYPE geometry(Point, 4326);
