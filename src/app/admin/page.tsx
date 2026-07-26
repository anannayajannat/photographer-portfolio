"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface DownloadRow {
  id: string;
  title: string;
  pricingMode: string;
  downloadCount: number;
  previewUrl: string;
}

interface Analytics {
  revenueCents: number;
  totalPaidOrders: number;
  downloadCounts: DownloadRow[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [hovered, setHovered] = useState<DownloadRow | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-black/50 text-sm">Loading…</p>;

  return (
    <div className="relative">
      <h1 className="text-2xl font-semibold mb-6">Overview</h1>
      <div className="grid grid-cols-2 gap-4 mb-10 max-w-md">
        <Stat label="Revenue" value={`$${(data.revenueCents / 100).toFixed(2)}`} />
        <Stat label="Paid orders" value={String(data.totalPaidOrders)} />
      </div>

      <h2 className="text-lg font-medium mb-3">Download counts</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-black/50 border-b border-black/10">
            <th className="py-2">Asset</th>
            <th>Pricing</th>
            <th>Downloads</th>
          </tr>
        </thead>
        <tbody>
          {data.downloadCounts.map((a) => (
            <tr
              key={a.id}
              className="border-b border-black/5 relative"
              onMouseEnter={() => setHovered(a)}
              onMouseLeave={() => setHovered((cur) => (cur?.id === a.id ? null : cur))}
            >
              <td className="py-2 cursor-default">{a.title}</td>
              <td>{a.pricingMode}</td>
              <td>{a.downloadCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hovered && (
        <div className="fixed z-50 bottom-8 right-8 w-56 rounded-lg overflow-hidden border border-black/10 shadow-xl bg-white pointer-events-none">
          <div className="relative w-full aspect-square">
            <Image src={hovered.previewUrl} alt={hovered.title} fill className="object-cover" />
          </div>
          <p className="text-xs px-3 py-2 truncate">{hovered.title}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black/10 rounded-lg p-4">
      <p className="text-xs text-black/50">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
