CREATE TYPE "public"."redemption_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."scout_badge" AS ENUM('none', 'bronze', 'silver', 'gold');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"badge_status" "scout_badge" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scouts_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "scouts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scout_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"status" "redemption_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sourcing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	CONSTRAINT "sourcing_no_self_loop" CHECK ("sourcing"."buyer_id" <> "sourcing"."seller_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scout_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_scout_id_scouts_id_fk" FOREIGN KEY ("scout_id") REFERENCES "public"."scouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_scout_id_scouts_id_fk" FOREIGN KEY ("scout_id") REFERENCES "public"."scouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scouts_badge_idx" ON "scouts" USING btree ("badge_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redemptions_scout_idx" ON "redemptions" USING btree ("scout_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redemptions_coupon_idx" ON "redemptions" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redemptions_status_idx" ON "redemptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sourcing_pair_idx" ON "sourcing" USING btree ("buyer_id","seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_business_idx" ON "reviews" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_scout_business_idx" ON "reviews" USING btree ("scout_id","business_id");