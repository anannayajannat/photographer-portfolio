import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { previewUrl, cloudinary } from "@/lib/cloudinary";
import { assetMetaSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [asset] = await db
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
    .where(eq(schema.assets.id, params.id));

  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...asset, previewUrl: previewUrl(asset.previewPublicId) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = assetMetaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(schema.assets)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.assets.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, params.id));
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clean up Cloudinary storage too, or we leak orphaned (and billed) assets.
  await Promise.allSettled([
    cloudinary.uploader.destroy(asset.previewPublicId),
    cloudinary.uploader.destroy(asset.originalPublicId, { type: "authenticated" }),
  ]);

  await db.delete(schema.assets).where(eq(schema.assets.id, params.id));
  return NextResponse.json({ ok: true });
}
