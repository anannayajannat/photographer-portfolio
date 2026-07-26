import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { signedOriginalUrl } from "@/lib/cloudinary";
import { verifyDownloadToken } from "@/lib/downloadToken";
import { freeDownloadLimit, paidDownloadLimit, isRateLimited } from "@/lib/rateLimit";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function GET(req: NextRequest, { params }: { params: { assetId: string } }) {
  const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, params.assetId));
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (asset.pricingMode === "FREE") {
    // Keyed by IP — nothing else distinguishes anonymous free-download requests.
    if (await isRateLimited(freeDownloadLimit, clientIp(req))) {
      return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    }

    await db
      .update(schema.assets)
      .set({ downloadCount: sql`${schema.assets.downloadCount} + 1` })
      .where(eq(schema.assets.id, asset.id));

    const url = signedOriginalUrl(asset.originalPublicId, asset.originalFormat);
    return NextResponse.json({ url });
  }

  // PAID: caller must present the token issued by the webhook.
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 401 });

  // Keyed by the token itself — a leaked/shared token gets its own budget,
  // independent of which IP is using it.
  if (await isRateLimited(paidDownloadLimit, token)) {
    return NextResponse.json({ error: "Too many requests for this download link." }, { status: 429 });
  }

  const payload = verifyDownloadToken(token);
  if (!payload || payload.assetId !== asset.id) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  // Re-check the order itself — covers refunds (status flips to REFUNDED,
  // which invalidates the token immediately, not just at its 1h expiry).
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, payload.orderId));
  if (!order || order.status !== "PAID" || order.downloadToken !== token) {
    return NextResponse.json({ error: "Order not valid for download" }, { status: 403 });
  }
  if (order.downloadExpiresAt && order.downloadExpiresAt < new Date()) {
    return NextResponse.json({ error: "Download link expired" }, { status: 403 });
  }

  const url = signedOriginalUrl(asset.originalPublicId, asset.originalFormat);
  return NextResponse.json({ url });
}
