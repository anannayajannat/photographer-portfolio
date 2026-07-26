import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { previewUrl } from "@/lib/cloudinary";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/Reveal";
import { PublicAsset } from "@/lib/types";

export const dynamic = "force-dynamic"; // see README: avoids a build-time DB dependency from ISR prerendering

async function getAssets(): Promise<PublicAsset[]> {
  const rows = await db.select().from(schema.assets).orderBy(desc(schema.assets.createdAt));
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

export default async function GalleryPage() {
  const assets = await getAssets();

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <Reveal className="mb-12 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">The Full Collection</p>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-ink">Gallery</h1>
        <p className="text-ink/50 mt-4 text-sm max-w-lg mx-auto">
          Browse by category, click any image to view details, purchase a print, or download the
          full-resolution file.
        </p>
      </Reveal>

      <Gallery assets={assets} />
    </div>
  );
}
