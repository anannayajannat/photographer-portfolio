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

export const dynamic = "force-dynamic";

// Extended the return type to include the new columns without breaking your existing PublicAsset type
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
  };
}

async function getRelated(category: string, excludeId: string): Promise<PublicAsset[]> {
  const rows = await db
    .select()
    .from(schema.assets)
    .where(and(eq(schema.assets.category, category), ne(schema.assets.id, excludeId)))
    .orderBy(desc(schema.assets.createdAt))
    .limit(4);

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

  // Fire-and-forget server-side view increment
  Promise.resolve().then(async () => {
    try {
      await db.update(schema.assets)
        .set({ viewCount: sql`${schema.assets.viewCount} + 1` })
        .where(eq(schema.assets.id, asset.id));
    } catch (err) {
      // Fail silently to not disrupt the user experience
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
      <Link href="/" className="text-sm text-ink/50 hover:text-ink transition-colors">
        ← Back to gallery
      </Link>
      
      <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden mt-4 mb-6">
        <Image src={asset.previewUrl} alt={asset.title} fill className="object-contain" priority />
      </div>
      
      <h1 className="font-serif text-2xl sm:text-3xl text-ink">{asset.title}</h1>
      
      {/* Updated Metadata Row with Views & Likes */}
      <div className="flex items-center gap-4 mb-4 mt-1">
        <p className="text-sm text-ink/50">{asset.category}</p>
        <span className="text-ink/20">|</span>
        <span className="text-ink/40 text-xs">{asset.viewCount + 1} views</span>
        <LikeButton assetId={asset.id} initialLikes={asset.likeCount} />
      </div>

      {asset.description && <p className="text-ink/70 mb-6 leading-relaxed">{asset.description}</p>}
      
      <PurchasePanel asset={asset} />

      {related.length > 0 && (
        <div className="mt-16 pt-10 border-t border-ink/10">
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-4">
            More from {asset.category}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/photo/${r.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-md bg-black/5 block"
              >
                <Image
                  src={r.previewUrl}
                  alt={r.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="text-white text-sm font-serif truncate">{r.title}</p>
                  <p className="text-white/70 text-xs mt-0.5">
                    {r.pricingMode === "FREE" ? "Free" : `$${(r.priceCents / 100).toFixed(2)}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}