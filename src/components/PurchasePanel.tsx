"use client";

import { useState } from "react";
import { PublicAsset } from "@/lib/types";

export default function PurchasePanel({ asset }: { asset: PublicAsset }) {
  const [buying, setBuying] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleFreeDownload() {
    const res = await fetch(`/api/download/${asset.id}`);
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
    else setError(data.error ?? "Download failed.");
  }

  async function handleBuy() {
    if (!email) {
      setError("Enter an email to receive your download link.");
      return;
    }
    setError(null);
    setBuying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, buyerEmail: email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } finally {
      setBuying(false);
    }
  }

  if (asset.pricingMode === "FREE") {
    return (
      <button
        onClick={handleFreeDownload}
        className="mt-2 self-start bg-ink text-white px-5 py-2 rounded-md text-sm hover:opacity-90"
      >
        Download free
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 max-w-sm">
      <div className="text-sm font-medium">${(asset.priceCents / 100).toFixed(2)}</div>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-ink/20 rounded-md px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleBuy}
        disabled={buying}
        className="bg-ink text-white px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50"
      >
        {buying ? "Redirecting…" : "Buy & download"}
      </button>
    </div>
  );
}
