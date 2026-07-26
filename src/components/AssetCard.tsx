"use client";

import Image from "next/image";
import Link from "next/link";
import { PublicAsset } from "@/lib/types";

export default function AssetCard({
  asset,
  onClick,
  priority = false,
}: {
  asset: PublicAsset & { likeCount?: number };
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
        <div className="flex items-end justify-between w-full translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <div className="min-w-0 pr-3">
            <p className="text-white font-serif text-base tracking-wide truncate">
              {asset.title}
            </p>
            <p className="text-graphite-light text-xs tracking-wider uppercase mt-0.5 delay-75">
              {asset.pricingMode === "FREE" ? "Free" : `$${(asset.priceCents / 100).toFixed(2)}`}
            </p>
          </div>
          
          {/* Subtle Like Count Addition */}
          {asset.likeCount !== undefined && (
            <span className="flex items-center gap-1 text-white/80 text-xs shrink-0 delay-75">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {asset.likeCount}
            </span>
          )}
        </div>
      </div>
      <div className="absolute top-3 right-3 text-[0.65rem] tracking-widest uppercase bg-paper/90 text-ink/70 px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        View
      </div>
    </Link>
  );
}