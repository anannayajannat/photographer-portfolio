"use client";

import { useEffect, useState } from "react";

interface OrderRow {
  id: string;
  assetTitle: string;
  buyerEmail: string;
  amountCents: number;
  stripeSessionId: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders));
  }, []);

  function copySession(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    });
  }

  if (!orders) return <p className="text-black/50 text-sm">Loading…</p>;

  const totalRevenue = orders.reduce((sum, o) => sum + o.amountCents, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-black/50">
          {orders.length} order{orders.length === 1 ? "" : "s"} · ${(totalRevenue / 100).toFixed(2)} total
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="border border-dashed border-black/15 rounded-lg py-16 text-center">
          <p className="text-black/40 text-sm">No paid orders yet.</p>
        </div>
      ) : (
        <div className="border border-black/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-black/50 bg-black/[0.03] border-b border-black/10">
                <th className="py-3 px-4 font-medium">Asset</th>
                <th className="font-medium">Buyer</th>
                <th className="font-medium">Amount</th>
                <th className="font-medium">Stripe session</th>
                <th className="font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                  <td className="py-3 px-4 font-medium">{o.assetTitle}</td>
                  <td className="text-black/70">{o.buyerEmail}</td>
                  <td>
                    <span className="inline-block bg-graphite/10 text-ink px-2 py-0.5 rounded-full text-xs font-medium">
                      ${(o.amountCents / 100).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => copySession(o.stripeSessionId)}
                      title="Click to copy"
                      className="font-mono text-xs text-black/50 hover:text-black hover:underline truncate max-w-[160px] inline-block align-bottom"
                    >
                      {copiedId === o.stripeSessionId ? "Copied ✓" : o.stripeSessionId}
                    </button>
                  </td>
                  <td className="text-black/60 text-xs whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
