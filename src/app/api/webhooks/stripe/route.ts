import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db, schema } from "@/lib/db";
import { issueDownloadToken } from "@/lib/downloadToken";
import { sendDownloadEmail, sendRefundEmail } from "@/lib/email";
import Stripe from "stripe";

export const runtime = "nodejs"; // needs raw body access, not available on edge

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    // The step that makes this endpoint trustworthy: without it, anyone
    // who discovers the URL could POST a fake "checkout.session.completed"
    // event and mint themselves a free download token.
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature ?? "",
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
  }

  if (event.type === "charge.refunded") {
    await handleRefund(event.data.object as Stripe.Charge);
  }

  if (event.type === "checkout.session.expired") {
    await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.stripeSessionId, session.id));

  if (!order) {
    // Shouldn't happen — /api/checkout always creates the row first — but
    // don't 500, or Stripe will retry this delivery indefinitely.
    return;
  }

  // Idempotency: Stripe redelivers events. If already PAID, do nothing —
  // re-issuing a token here would silently invalidate the one already
  // emailed to the buyer.
  if (order.status === "PAID") return;

  const token = issueDownloadToken({ orderId: order.id, assetId: order.assetId });
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const [asset] = await db
    .select({ title: schema.assets.title })
    .from(schema.assets)
    .where(eq(schema.assets.id, order.assetId));

  await db.transaction(async (tx) => {
    await tx
      .update(schema.orders)
      .set({
        status: "PAID",
        downloadToken: token,
        downloadExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        paymentIntentId,
      })
      .where(eq(schema.orders.id, order.id));

    await tx
      .update(schema.assets)
      .set({ downloadCount: sql`${schema.assets.downloadCount} + 1` })
      .where(eq(schema.assets.id, order.assetId));
  });

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const downloadUrl = `${appUrl}/api/download/${order.assetId}?token=${token}`;

  // Don't let an email failure fail the webhook — the success page is
  // still a working fallback for the buyer.
  await sendDownloadEmail({
    to: order.buyerEmail,
    assetTitle: asset?.title ?? "your purchase",
    downloadUrl,
  });
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.paymentIntentId, paymentIntentId));

  if (!order || order.status !== "PAID") return; // nothing to revoke — already refunded, or never paid

  await db
    .update(schema.orders)
    .set({ status: "REFUNDED", downloadToken: null, downloadExpiresAt: null })
    .where(eq(schema.orders.id, order.id));

  const [asset] = await db
    .select({ title: schema.assets.title })
    .from(schema.assets)
    .where(eq(schema.assets.id, order.assetId));

  // Same fire-and-log reasoning as the purchase email: don't let an email
  // failure fail the webhook and trigger a pointless Stripe retry against
  // an order that's already correctly marked REFUNDED.
  await sendRefundEmail({ to: order.buyerEmail, assetTitle: asset?.title ?? "your purchase" });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.stripeSessionId, session.id));

  // Only touch orders still PENDING — if it somehow already completed
  // (a completed + expired pair arriving out of order), never downgrade
  // a PAID order to FAILED.
  if (!order || order.status !== "PENDING") return;

  await db.update(schema.orders).set({ status: "FAILED" }).where(eq(schema.orders.id, order.id));
}
