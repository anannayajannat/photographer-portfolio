import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { uploadOriginal, uploadPreview } from "@/lib/cloudinary";
import { assetMetaSchema } from "@/lib/validations";

export const runtime = "nodejs"; // cloudinary streams + file-type sniffing need the Node runtime, not edge

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const metaRaw = form.get("meta") as string | null;

  if (!file || !metaRaw) {
    return NextResponse.json({ error: "Missing file or meta" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const parsed = assetMetaSchema.safeParse(JSON.parse(metaRaw));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // `file.type` is the browser-supplied Content-Type — entirely
  // client-controlled, so it's not a real check on its own (someone can
  // rename a script to photo.jpg and the browser will happily report
  // "image/jpeg"). Sniff the actual magic bytes instead, and only trust
  // that — the client-reported type is ignored from here on.
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    return NextResponse.json(
      { error: "File content doesn't match an allowed image type (jpeg/png/webp)." },
      { status: 400 }
    );
  }

  const [
    { publicId: originalPublicId, format: originalFormat, width: originalWidth, height: originalHeight, bytes: originalBytes },
    previewPublicId,
  ] = await Promise.all([
    uploadOriginal(buffer, "originals"),
    uploadPreview(buffer, "previews"),
  ]);

  const [asset] = await db
    .insert(schema.assets)
    .values({
      ...parsed.data,
      originalPublicId,
      originalFormat,
      originalWidth,
      originalHeight,
      originalBytes,
      previewPublicId,
    })
    .returning();

  return NextResponse.json(asset, { status: 201 });
}
