import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { uploadServiceImage, previewUrl, cloudinary } from "@/lib/cloudinary";
import { serviceMetaSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [service] = await db.select().from(schema.services).where(eq(schema.services.id, params.id));
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...service,
    imageUrl: service.imagePublicId ? previewUrl(service.imagePublicId) : null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const metaRaw = form.get("meta") as string | null;
  const file = form.get("file") as File | null;
  if (!metaRaw) return NextResponse.json({ error: "Missing meta" }, { status: 400 });

  const parsed = serviceMetaSchema.safeParse(JSON.parse(metaRaw));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [existing] = await db.select().from(schema.services).where(eq(schema.services.id, params.id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let imagePublicId = existing.imagePublicId;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    imagePublicId = await uploadServiceImage(buffer);
    // Replace, don't leak — remove the old image now that a new one is live.
    if (existing.imagePublicId) {
      await cloudinary.uploader.destroy(existing.imagePublicId).catch(() => {});
    }
  }

  // Deliberately does NOT touch `slug` — once a service has a permalink,
  // editing its title shouldn't move that URL out from under anyone who
  // already bookmarked or shared it.
  const [updated] = await db
    .update(schema.services)
    .set({ ...parsed.data, imagePublicId, updatedAt: new Date() })
    .where(eq(schema.services.id, params.id))
    .returning();

  return NextResponse.json(updated);
}

const reorderSchema = z.object({ sortOrder: z.number().int() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(schema.services)
    .set({ sortOrder: parsed.data.sortOrder })
    .where(eq(schema.services.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [service] = await db.select().from(schema.services).where(eq(schema.services.id, params.id));
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (service.imagePublicId) {
    await cloudinary.uploader.destroy(service.imagePublicId).catch(() => {});
  }

  await db.delete(schema.services).where(eq(schema.services.id, params.id));
  return NextResponse.json({ ok: true });
}
