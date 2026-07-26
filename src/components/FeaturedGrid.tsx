"use client";

import { useState } from "react";
import { PublicAsset } from "@/lib/types";
import AssetCard from "./AssetCard";
import Lightbox from "./Lightbox";
import Reveal from "./Reveal";

export default function FeaturedGrid({ assets }: { assets: PublicAsset[] }) {
  const [active, setActive] = useState<PublicAsset | null>(null);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {assets.map((asset, i) => (
          <Reveal key={asset.id} delay={i * 70}>
            <AssetCard asset={asset} onClick={() => setActive(asset)} priority={i < 4} />
          </Reveal>
        ))}
      </div>
      {active && <Lightbox asset={active} onClose={() => setActive(null)} />}
    </div>
  );
}
