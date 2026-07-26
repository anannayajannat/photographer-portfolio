import { NextRequest, NextResponse } from "next/server";
import { asc, max } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { uploadServiceImage, previewUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db.select().from(schema.aboutImages).orderBy(asc(schema.aboutImages.sortOrder));
  const withUrls = rows.map((img) => ({ ...img, imageUrl: previewUrl(img.imagePublicId) }));
  return NextResponse.json(withUrls);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const caption = (form.get("caption") as string | null) ?? undefined;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Reuses the same public, unwatermarked uploader as service photos —
  // these are promotional images, not sellable assets, so none of the
  // asset pipeline's authenticated-storage/watermark logic applies here.
  const imagePublicId = await uploadServiceImage(buffer);

  const [{ value: currentMax }] = await db
    .select({ value: max(schema.aboutImages.sortOrder) })
    .from(schema.aboutImages);

  const [image] = await db
    .insert(schema.aboutImages)
    .values({ imagePublicId, caption, sortOrder: (currentMax ?? 0) + 1 })
    .returning();

  return NextResponse.json(image, { status: 201 });
}
