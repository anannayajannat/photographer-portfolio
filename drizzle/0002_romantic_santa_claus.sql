CREATE TABLE IF NOT EXISTS "about_images" (
	"id" text PRIMARY KEY NOT NULL,
	"image_public_id" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "about_images_sort_idx" ON "about_images" USING btree ("sort_order");