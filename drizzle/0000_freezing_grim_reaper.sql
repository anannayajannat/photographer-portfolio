DO $$ BEGIN
 CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pricing_mode" AS ENUM('FREE', 'PAID');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"pricing_mode" "pricing_mode" DEFAULT 'FREE' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"preview_public_id" text NOT NULL,
	"original_public_id" text NOT NULL,
	"original_format" text DEFAULT 'jpg' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"buyer_email" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"stripe_session_id" text NOT NULL,
	"payment_intent_id" text,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"download_token" text,
	"download_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripe_session_id_unique" UNIQUE("stripe_session_id"),
	CONSTRAINT "orders_payment_intent_id_unique" UNIQUE("payment_intent_id"),
	CONSTRAINT "orders_download_token_unique" UNIQUE("download_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_content" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_category_idx" ON "assets" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_asset_idx" ON "orders" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_session_idx" ON "orders" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_payment_intent_idx" ON "orders" USING btree ("payment_intent_id");