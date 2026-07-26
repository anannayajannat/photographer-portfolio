"use client";

import Image from "next/image";
import Link from "next/link";
import { PublicAsset } from "@/lib/types";

export default function AssetCard({
  asset,
  onClick,
  priority = false,
}: {
  asset: PublicAsset;
  onClick: () => void;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/photo/${asset.id}`}
      onClick={(e) => {
        // A real, crawlable link to the permalink page (works with JS off,
        // and gives search engines something to index) — but when JS is
        // available, intercept the click and open the in-page lightbox
        // instead, which is the faster experience for someone browsing.
        e.preventDefault();
        onClick();
      }}
      className="group relative aspect-[4/5] overflow-hidden rounded-md bg-black/5 block"
    >
      <Image
        src={asset.previewUrl}
        alt={asset.title}
        fill
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-105 select-none"
        draggable={false}
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <p className="text-white font-serif text-base tracking-wide truncate translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          {asset.title}
        </p>
        <p className="text-graphite-light text-xs tracking-wider uppercase mt-0.5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300 delay-75">
          {asset.pricingMode === "FREE" ? "Free" : `$${(asset.priceCents / 100).toFixed(2)}`}
        </p>
      </div>
      <div className="absolute top-3 right-3 text-[0.65rem] tracking-widest uppercase bg-paper/90 text-ink/70 px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        View
      </div>
    </Link>
  );
}
