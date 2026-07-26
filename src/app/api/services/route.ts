import { NextRequest, NextResponse } from "next/server";
import { asc, eq, max } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { uploadServiceImage, previewUrl } from "@/lib/cloudinary";
import { serviceMetaSchema, slugify } from "@/lib/validations";

export const runtime = "nodejs"; // cloudinary upload needs the Node runtime, not edge

export async function GET() {
  const rows = await db.select().from(schema.services).orderBy(asc(schema.services.sortOrder));
  const withUrls = rows.map((s) => ({
    ...s,
    imageUrl: s.imagePublicId ? previewUrl(s.imagePublicId) : null,
  }));
  return NextResponse.json(withUrls);
}

/** Ensures a unique slug by appending -2, -3, ... on collision — the
 * client never supplies a slug, so this is the only place one is minted. */
async function uniqueSlug(base: string): Promise<string> {
  const root = base || "service";
  let candidate = root;
  let suffix = 2;
  while (true) {
    const [existing] = await db
      .select({ id: schema.services.id })
      .from(schema.services)
      .where(eq(schema.services.slug, candidate));
    if (!existing) return candidate;
    candidate = `${root}-${suffix}`;
    suffix++;
  }
}

export async function POST(req: NextRequest) {
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

  let imagePublicId: string | null = null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    imagePublicId = await uploadServiceImage(buffer);
  }

  const slug = await uniqueSlug(slugify(parsed.data.title));

  // New services go to the end of the list by default — admin reorders
  // from there rather than guessing a sort position up front.
  const [{ value: currentMax }] = await db
    .select({ value: max(schema.services.sortOrder) })
    .from(schema.services);

  const [service] = await db
    .insert(schema.services)
    .values({ ...parsed.data, slug, imagePublicId, sortOrder: (currentMax ?? 0) + 1 })
    .returning();

  return NextResponse.json(service, { status: 201 });
}
