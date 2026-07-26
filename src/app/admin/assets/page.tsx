"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicAsset } from "@/lib/types";

type PricingFilter = "ALL" | "FREE" | "PAID";

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<PublicAsset[] | null>(null);
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  function load() {
    fetch("/api/assets")
      .then((r) => r.json())
      .then(setAssets);
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset? This also removes it from Cloudinary.")) return;
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const categories = useMemo(() => {
    if (!assets) return [];
    return Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));
  }, [assets]);

  const filtered = useMemo(() => {
    if (!assets) return [];
    return assets.filter((a) => {
      if (pricingFilter !== "ALL" && a.pricingMode !== pricingFilter) return false;
      if (categoryFilter !== "ALL" && a.category !== categoryFilter) return false;
      return true;
    });
  }, [assets, pricingFilter, categoryFilter]);

  if (!assets) return <p className="text-black/50 text-sm">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <Link href="/admin/assets/new" className="bg-ink text-white px-4 py-2 rounded-md text-sm">
          Upload new
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
        <div className="flex rounded-full border border-black/15 overflow-hidden">
          {(["ALL", "FREE", "PAID"] as PricingFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPricingFilter(f)}
              className={`px-3 py-1.5 ${
                pricingFilter === f ? "bg-ink text-white" : "text-black/60 hover:bg-black/5"
              }`}
            >
              {f === "ALL" ? "All" : f === "FREE" ? "Free" : "Paid"}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-black/15 rounded-full px-3 py-1.5 text-sm bg-transparent"
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <span className="text-black/40 text-xs">
          {filtered.length} of {assets.length} shown
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-black/50 text-sm">No assets match this filter.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="border border-black/10 rounded-lg overflow-hidden">
              <Link href={`/admin/assets/${a.id}/edit`} className="block relative aspect-square group">
                <Image src={a.previewUrl} alt={a.title} fill className="object-cover" />
                <span
                  className={`absolute top-2 left-2 text-[0.65rem] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    a.pricingMode === "FREE" ? "bg-emerald-600 text-white" : "bg-graphite text-white"
                  }`}
                >
                  {a.pricingMode === "FREE" ? "Free" : "Paid"}
                </span>
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs uppercase tracking-widest">Click to edit</span>
                </span>
              </Link>
              <div className="p-3">
                <Link href={`/admin/assets/${a.id}/edit`} className="text-sm font-medium truncate block hover:underline">
                  {a.title}
                </Link>
                <p className="text-xs text-black/50">
                  {a.category} · {a.pricingMode === "FREE" ? "Free" : `$${(a.priceCents / 100).toFixed(2)}`}
                </p>
                <p className="text-xs text-black/40 mt-1">{a.downloadCount} downloads</p>
                <div className="flex gap-3 mt-2">
                  <Link
                    href={`/admin/assets/${a.id}/edit`}
                    className="text-xs bg-ink text-white px-2.5 py-1 rounded-md hover:opacity-90"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
