import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { cloudinary } from "@/lib/cloudinary";

const patchSchema = z.object({
  sortOrder: z.number().int().optional(),
  caption: z.string().max(300).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(schema.aboutImages)
    .set(parsed.data)
    .where(eq(schema.aboutImages.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [image] = await db.select().from(schema.aboutImages).where(eq(schema.aboutImages.id, params.id));
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await cloudinary.uploader.destroy(image.imagePublicId).catch(() => {});
  await db.delete(schema.aboutImages).where(eq(schema.aboutImages.id, params.id));
  return NextResponse.json({ ok: true });
}
