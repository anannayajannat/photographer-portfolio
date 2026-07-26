import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { previewUrl } from "@/lib/cloudinary";

// Public: list assets, filterable by category. Deliberately never selects
// originalPublicId — the client has no legitimate use for it and should
// never see it, so we don't even fetch the column.
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");

  const rows = category
    ? await db
        .select({
          id: schema.assets.id,
          title: schema.assets.title,
          description: schema.assets.description,
          category: schema.assets.category,
          tags: schema.assets.tags,
          pricingMode: schema.assets.pricingMode,
          priceCents: schema.assets.priceCents,
          previewPublicId: schema.assets.previewPublicId,
          downloadCount: schema.assets.downloadCount,
          createdAt: schema.assets.createdAt,
        })
        .from(schema.assets)
        .where(eq(schema.assets.category, category))
        .orderBy(desc(schema.assets.createdAt))
    : await db
        .select({
          id: schema.assets.id,
          title: schema.assets.title,
          description: schema.assets.description,
          category: schema.assets.category,
          tags: schema.assets.tags,
          pricingMode: schema.assets.pricingMode,
          priceCents: schema.assets.priceCents,
          previewPublicId: schema.assets.previewPublicId,
          downloadCount: schema.assets.downloadCount,
          createdAt: schema.assets.createdAt,
        })
        .from(schema.assets)
        .orderBy(desc(schema.assets.createdAt));

  const withUrls = rows.map((a) => ({ ...a, previewUrl: previewUrl(a.previewPublicId) }));
  return NextResponse.json(withUrls);
}
