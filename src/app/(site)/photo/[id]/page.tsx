import { eq, and, ne, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { db, schema } from "@/lib/db";
import { previewUrl } from "@/lib/cloudinary";
import PurchasePanel from "@/components/PurchasePanel";
import { PublicAsset } from "@/lib/types";
import LikeButton from "@/components/LikeButton";
import { formatBytes, estimatePrintSize } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getAsset(id: string): Promise<(PublicAsset & { viewCount: number; likeCount: number }) | null> {
  const [a] = await db.select().from(schema.assets).where(eq(schema.assets.id, id));
  if (!a) return null;

  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    tags: a.tags,
    pricingMode: a.pricingMode,
    priceCents: a.priceCents,
    previewUrl: previewUrl(a.previewPublicId),
    downloadCount: a.downloadCount,
    featured: a.featured,
    createdAt: a.createdAt.toISOString(),
    viewCount: a.viewCount,
    likeCount: a.likeCount,
    originalWidth: a.originalWidth,
    originalHeight: a.originalHeight,
    originalBytes: a.originalBytes,
  };
}

async function getRelated(category: string, excludeId: string): Promise<PublicAsset[]> {
  const rows = await db
    .select()
    .from(schema.assets)
    .where(and(eq(schema.assets.category, category), ne(schema.assets.id, excludeId)))
    .orderBy(desc(schema.assets.createdAt))
    .limit(6);

  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    tags: a.tags,
    pricingMode: a.pricingMode,
    priceCents: a.priceCents,
    previewUrl: previewUrl(a.previewPublicId),
    downloadCount: a.downloadCount,
    featured: a.featured,
    createdAt: a.createdAt.toISOString(),
    originalWidth: a.originalWidth,
    originalHeight: a.originalHeight,
    originalBytes: a.originalBytes,
  }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const asset = await getAsset(params.id);
  if (!asset) return { title: "Photo not found" };

  const description = asset.description ?? `${asset.category} photography — Photographer Portfolio.`;

  return {
    title: `${asset.title} | Photographer Portfolio`,
    description,
    openGraph: {
      title: asset.title,
      description,
      images: [{ url: asset.previewUrl }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: asset.title,
      description,
      images: [asset.previewUrl],
    },
  };
}

export default async function PhotoPage({ params }: { params: { id: string } }) {
  const asset = await getAsset(params.id);
  if (!asset) notFound();

  const related = await getRelated(asset.category, asset.id);
  const hasDimensions = Boolean(asset.originalWidth && asset.originalHeight);

  // Fire-and-forget server-side view increment
  Promise.resolve().then(async () => {
    try {
      await db
        .update(schema.assets)
        .set({ viewCount: sql`${schema.assets.viewCount} + 1` })
        .where(eq(schema.assets.id, asset.id));
    } catch (err) {
      // Fail silently to not disrupt the user experience
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
      <Link href="/" className="text-sm text-ink/50 hover:text-ink transition-colors">
        ← Back to gallery
      </Link>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
        {/* Main column */}
        <div className="min-w-0">
          <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden mb-6">
            <Image src={asset.previewUrl} alt={asset.title} fill className="object-contain" priority />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-ink">{asset.title}</h1>

          <div className="flex items-center gap-4 mb-4 mt-1 flex-wrap">
            <p className="text-sm text-ink/50">{asset.category}</p>
            <span className="text-ink/20">|</span>
            <span className="text-ink/40 text-xs">{asset.viewCount + 1} views</span>
            <LikeButton assetId={asset.id} initialLikes={asset.likeCount} />
          </div>

          {asset.description && <p className="text-ink/70 mb-6 leading-relaxed">{asset.description}</p>}

          {/* File details — what a buyer is actually getting */}
          {hasDimensions && (
            <div className="mb-6 rounded-lg border border-ink/10 divide-y divide-ink/10 text-sm overflow-hidden">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-ink/50">Dimensions</span>
                <span className="text-ink font-medium">
                  {asset.originalWidth} × {asset.originalHeight}px
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-ink/50">Est. print size</span>
                <span className="text-ink font-medium">
                  {estimatePrintSize(asset.originalWidth!, asset.originalHeight!)} @ 300dpi
                </span>
              </div>
              {asset.originalBytes != null && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-ink/50">File size</span>
                  <span className="text-ink font-medium">{formatBytes(asset.originalBytes)}</span>
                </div>
              )}
            </div>
          )}

          <PurchasePanel asset={asset} />
        </div>

        {/* Sidebar — real "Similar Photos" panel, not a below-the-fold strip */}
        {related.length > 0 && (
          <aside className="lg:border-l lg:border-ink/10 lg:pl-8">
            <p className="text-xs tracking-widest uppercase text-ink/40 mb-4">Similar Photos</p>
            <div className="flex flex-col gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/photo/${r.id}`}
                  className="group flex gap-3 rounded-md hover:bg-black/[0.03] p-1 -m-1 transition-colors"
                >
                  <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-md bg-black/5">
                    <Image
                      src={r.previewUrl}
                      alt={r.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-serif text-ink truncate">{r.title}</p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {r.pricingMode === "FREE" ? "Free" : `$${(r.priceCents / 100).toFixed(2)}`}
                    </p>
                    {r.originalWidth && r.originalHeight && (
                      <p className="text-[0.7rem] text-ink/35 mt-0.5">
                        {r.originalWidth} × {r.originalHeight}px
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
