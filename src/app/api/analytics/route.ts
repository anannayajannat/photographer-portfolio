import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { previewUrl } from "@/lib/cloudinary";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paidOrders = await db
    .select({
      id: schema.orders.id,
      buyerEmail: schema.orders.buyerEmail,
      amountCents: schema.orders.amountCents,
      stripeSessionId: schema.orders.stripeSessionId,
      createdAt: schema.orders.createdAt,
      assetTitle: schema.assets.title,
    })
    .from(schema.orders)
    .innerJoin(schema.assets, eq(schema.orders.assetId, schema.assets.id))
    .where(eq(schema.orders.status, "PAID"))
    .orderBy(desc(schema.orders.createdAt))
    .limit(100);

  const assetRows = await db
    .select({
      id: schema.assets.id,
      title: schema.assets.title,
      pricingMode: schema.assets.pricingMode,
      downloadCount: schema.assets.downloadCount,
      previewPublicId: schema.assets.previewPublicId,
    })
    .from(schema.assets);

  const assets = assetRows.map((a) => ({
    id: a.id,
    title: a.title,
    pricingMode: a.pricingMode,
    downloadCount: a.downloadCount,
    previewUrl: previewUrl(a.previewPublicId),
  }));

  const revenueCents = paidOrders.reduce((sum, o) => sum + o.amountCents, 0);

  return NextResponse.json({
    revenueCents,
    totalPaidOrders: paidOrders.length,
    orders: paidOrders,
    downloadCounts: assets,
  });
}
