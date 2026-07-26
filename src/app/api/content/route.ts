import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { siteContentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key) {
    const [row] = await db.select().from(schema.siteContent).where(eq(schema.siteContent.key, key));
    return NextResponse.json(row?.value ?? null);
  }
  const all = await db.select().from(schema.siteContent);
  return NextResponse.json(all);
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = siteContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .insert(schema.siteContent)
    .values({ key: parsed.data.key, value: parsed.data.value })
    .onConflictDoUpdate({
      target: schema.siteContent.key,
      set: { value: parsed.data.value, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json(row);
}
