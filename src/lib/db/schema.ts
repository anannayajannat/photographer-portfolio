import { pgTable, text, integer, timestamp, jsonb, pgEnum, index, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const pricingModeEnum = pgEnum("pricing_mode", ["FREE", "PAID"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PAID", "FAILED", "REFUNDED"]);

export const admins = pgTable("admins", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    pricingMode: pricingModeEnum("pricing_mode").notNull().default("FREE"),
    priceCents: integer("price_cents").notNull().default(0),
    // Cloudinary public IDs, not raw URLs — regenerate signed/transformed
    // URLs on demand instead of trusting a stored link.
    previewPublicId: text("preview_public_id").notNull(),
    originalPublicId: text("original_public_id").notNull(),
    // Cloudinary's actual detected format (jpg/png/webp) at upload time.
    // Without this, signed download URLs have to guess a format — and a
    // guessed "jpg" for a PNG original silently triggers an unwanted
    // format conversion instead of serving the real file.
    originalFormat: text("original_format").notNull().default("jpg"),
    // Captured from Cloudinary's upload response, not computed client-side
    // (never trust dimensions/size the client claims about its own file).
    // Nullable — assets uploaded before this column existed simply don't
    // show this info rather than needing a backfill migration.
    originalWidth: integer("original_width"),
    originalHeight: integer("original_height"),
    originalBytes: integer("original_bytes"),
    downloadCount: integer("download_count").notNull().default(0),
    // Admin-controlled curation for the homepage's "Selected Work" strip —
    // deliberately independent of createdAt, so the photographer picks
    // their strongest images rather than the homepage always just showing
    // whatever was uploaded most recently.
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
  },
  (table) => ({
    categoryIdx: index("assets_category_idx").on(table.category),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id),
    buyerEmail: text("buyer_email").notNull(),
    amountCents: integer("amount_cents").notNull(),
    stripeSessionId: text("stripe_session_id").notNull().unique(),
    // Needed to correlate a later `charge.refunded` event back to this
    // order — Stripe's refund webhook only carries the charge/payment
    // intent, not the checkout session id.
    paymentIntentId: text("payment_intent_id").unique(),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    downloadToken: text("download_token").unique(),
    downloadExpiresAt: timestamp("download_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    assetIdx: index("orders_asset_idx").on(table.assetId),
    sessionIdx: index("orders_session_idx").on(table.stripeSessionId),
    paymentIntentIdx: index("orders_payment_intent_idx").on(table.paymentIntentId),
  })
);

export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    // URL-safe, unique, derived from title server-side (see validations.ts)
    // — this is what makes /services/[slug] a real, stable, shareable
    // page instead of the list-only JSON blob it replaced.
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    // Free-form on purpose ("From $400", "Custom quote") — service pricing
    // isn't a fixed cents amount the way an asset's is, so this isn't run
    // through Stripe at all, just displayed.
    price: text("price"),
    shortDescription: text("short_description"),
    description: text("description"),
    // Optional — a service doesn't require a photo, but can have one.
    imagePublicId: text("image_public_id"),
    // Admin-controlled display order (see /admin/services — swap-based
    // reordering, not drag-and-drop, kept intentionally simple).
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sortIdx: index("services_sort_idx").on(table.sortOrder),
  })
);

export const aboutImages = pgTable(
  "about_images",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    imagePublicId: text("image_public_id").notNull(),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sortIdx: index("about_images_sort_idx").on(table.sortOrder),
  })
);
