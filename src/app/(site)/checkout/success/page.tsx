import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import DownloadButton from "@/components/DownloadButton";

export const dynamic = "force-dynamic"; // must always re-check payment status, never cache

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  if (!sessionId) return <Message text="Missing checkout session." />;

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.stripeSessionId, sessionId));

  if (!order) return <Message text="We couldn't find that order." />;

  // The webhook can arrive a beat after Stripe redirects the browser here —
  // never assume PAID just because the user landed on /success.
  if (order.status !== "PAID" || !order.downloadToken) {
    return (
      <Message text="Payment received — finalizing your order and emailing your download link. Refresh in a few seconds if this doesn't update." />
    );
  }

  const [asset] = await db
    .select({ title: schema.assets.title })
    .from(schema.assets)
    .where(eq(schema.assets.id, order.assetId));

  const downloadUrl = `/api/download/${order.assetId}?token=${order.downloadToken}`;

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold mb-2">Thank you!</h1>
      <p className="text-black/60 text-sm mb-2">
        Your purchase of <strong>{asset?.title}</strong> is confirmed.
      </p>
      <p className="text-black/40 text-xs mb-8">A copy of this link was also emailed to {order.buyerEmail}.</p>
      <DownloadButton downloadUrl={downloadUrl} />
      <p className="text-black/40 text-xs mt-4">This link expires in 1 hour.</p>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return <div className="max-w-md mx-auto px-6 py-24 text-center text-black/60">{text}</div>;
}
