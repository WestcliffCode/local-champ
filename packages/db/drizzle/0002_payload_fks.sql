-- Phase 1.C — FK constraints from Drizzle-owned tables to Payload-owned tables.
--
-- These were deferred from Phase 1.A because the target tables (`businesses`,
-- `coupons`) didn't exist yet. Payload's first migration (Phase 1.B) creates
-- those tables; this migration wires the relationships.
--
-- All four constraints use ON DELETE CASCADE — when a parent business or
-- coupon is removed, dependent redemptions, sourcing edges, and reviews
-- go with it. Revisit if we ever decide redemption history must outlive
-- the coupon (likely, for analytics purposes — see Phase 4).

ALTER TABLE "redemptions"
  ADD CONSTRAINT "redemptions_coupon_id_coupons_id_fk"
  FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

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
