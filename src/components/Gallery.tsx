"use client";

import { useMemo, useState } from "react";
import { PublicAsset } from "@/lib/types";
import AssetCard from "./AssetCard";
import Lightbox from "./Lightbox";

export default function Gallery({ assets }: { assets: PublicAsset[] }) {
  const [category, setCategory] = useState<string | "all">("all");
  const [active, setActive] = useState<PublicAsset | null>(null);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(assets.map((a) => a.category)))],
    [assets]
  );

  const filtered =
    category === "all" ? assets : assets.filter((a) => a.category === category);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              category === c
                ? "bg-ink text-white border-ink"
                : "border-black/15 text-black/70 hover:border-black/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-black/50 text-sm">No images in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((asset, i) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => setActive(asset)}
              priority={i < 4}
            />
          ))}
        </div>
      )}

      {active && <Lightbox asset={active} onClose={() => setActive(null)} />}
    </div>
  );
}
