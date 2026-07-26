import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { db, schema } from "@/lib/db";
import { previewUrl } from "@/lib/cloudinary";
import PurchasePanel from "@/components/PurchasePanel";
import { PublicAsset } from "@/lib/types";

export const dynamic = "force-dynamic"; // same reasoning as the other DB-backed pages — see README

async function getAsset(id: string): Promise<PublicAsset | null> {
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
    createdAt: a.createdAt.toISOString(),
  };
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/" className="text-sm text-black/50 hover:text-black">
        ← Back to gallery
      </Link>
      <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden mt-4 mb-6">
        <Image src={asset.previewUrl} alt={asset.title} fill className="object-contain" priority />
      </div>
      <h1 className="text-2xl font-semibold">{asset.title}</h1>
      <p className="text-sm text-black/60 mb-4">{asset.category}</p>
      {asset.description && <p className="text-black/70 mb-6">{asset.description}</p>}
      <PurchasePanel asset={asset} />
    </div>
  );
}
