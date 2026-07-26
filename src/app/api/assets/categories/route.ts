import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

const renameSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1).max(60),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { from, to } = parsed.data;
  if (from === to) return NextResponse.json({ updated: 0 });

  const updated = await db
    .update(schema.assets)
    .set({ category: to, updatedAt: new Date() })
    .where(eq(schema.assets.category, from))
    .returning({ id: schema.assets.id });

  return NextResponse.json({ updated: updated.length });
}
