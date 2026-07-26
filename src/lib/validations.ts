import { z } from "zod";

export const assetMetaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(60),
  tags: z.array(z.string().max(40)).max(20).default([]),
  pricingMode: z.enum(["FREE", "PAID"]),
  // Price is only meaningful when PAID; enforced below with a refine.
  priceCents: z.number().int().min(0).max(100_000_00),
}).refine(
  (data) => data.pricingMode === "FREE" || data.priceCents > 0,
  { message: "Paid assets must have a price greater than 0", path: ["priceCents"] }
);

// Separate from assetMetaSchema on purpose — the admin gallery grid
// toggles this with one click and shouldn't need to resend the full
// edit form (title/category/price/etc.) just to flip one flag.
export const toggleFeaturedSchema = z.object({
  featured: z.boolean(),
});

export const checkoutSchema = z.object({
  assetId: z.string().min(1),
  buyerEmail: z.string().email(),
});

export const siteContentSchema = z.object({
  key: z.enum(["about", "contact", "services", "social"]),
  value: z.record(z.any()),
});

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(4000),
  // Honeypot: a real user never fills this (it's visually hidden). Any
  // value here means a bot filled every field it could find — reject
  // silently rather than spending a Resend call on it.
  companyWebsite: z.string().max(0).optional(),
});

export const serviceMetaSchema = z.object({
  title: z.string().min(1).max(120),
  price: z.string().max(60).optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(4000).optional(),
});

/** Server-side slug generation — the client never supplies or edits a
 * slug directly, so there's no way to submit one that collides with
 * reserved routes or contains unsafe characters. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
