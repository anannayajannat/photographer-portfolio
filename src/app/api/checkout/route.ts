import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { assetId, buyerEmail } = parsed.data;

  const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, assetId));
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  if (asset.pricingMode !== "PAID") {
    return NextResponse.json({ error: "Asset is not for sale" }, { status: 400 });
  }

  const origin = req.nextUrl.origin;

  // Price comes from asset.priceCents in the DB — the client only ever
  // sends an assetId. A tampered request body doesn't matter here.
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: buyerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: asset.title },
          unit_amount: asset.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    metadata: { assetId: asset.id },
    // Stripe's default session expiry is ~24h, which makes an abandoned
    // checkout linger as PENDING for a full day before checkout.session
    // .expired even fires. 30 minutes is Stripe's minimum allowed value —
    // short enough that cleanup is actually demoable, still generous for
    // a real buyer mid-checkout.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await db.insert(schema.orders).values({
    assetId: asset.id,
    buyerEmail,
    amountCents: asset.priceCents,
    stripeSessionId: checkoutSession.id,
    status: "PENDING",
  });

  return NextResponse.json({ url: checkoutSession.url });
}
