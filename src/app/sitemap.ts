import { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic"; // see README: avoids a build-time DB dependency

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/gallery`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/services`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const assets = await db
    .select({ id: schema.assets.id, updatedAt: schema.assets.updatedAt })
    .from(schema.assets);

  const assetRoutes: MetadataRoute.Sitemap = assets.map((a) => ({
    url: `${baseUrl}/photo/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...assetRoutes];
}
