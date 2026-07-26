import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db, schema } from "@/lib/db";
import { previewUrl } from "@/lib/cloudinary";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

async function getService(slug: string) {
  const [s] = await db.select().from(schema.services).where(eq(schema.services.slug, slug));
  return s ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = await getService(params.slug);
  if (!service) return { title: "Service not found" };

  const description = service.shortDescription ?? `${service.title} — Photographer Portfolio.`;
  return {
    title: `${service.title} | Photographer Portfolio`,
    description,
    openGraph: {
      title: service.title,
      description,
      images: service.imagePublicId ? [{ url: previewUrl(service.imagePublicId) }] : undefined,
      type: "website",
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await getService(params.slug);
  if (!service) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/services" className="text-sm text-ink/50 hover:text-ink">
        ← All services
      </Link>

      <Reveal>
        {service.imagePublicId && (
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-black/5 mt-6 mb-8">
            <Image
              src={previewUrl(service.imagePublicId)}
              alt={service.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="flex items-baseline justify-between gap-4 mt-6 mb-4">
          <h1 className="font-serif text-3xl md:text-4xl text-ink">{service.title}</h1>
          {service.price && (
            <span className="text-sm text-ink/70 whitespace-nowrap font-medium shrink-0">
              {service.price}
            </span>
          )}
        </div>

        {service.description ? (
          service.description.split("\n\n").map((p, i) => (
            <p key={i} className="text-ink/70 leading-relaxed mb-4">
              {p}
            </p>
          ))
        ) : service.shortDescription ? (
          <p className="text-ink/70 leading-relaxed mb-4">{service.shortDescription}</p>
        ) : null}

        <Link
          href="/contact"
          className="inline-block mt-4 bg-ink text-paper px-7 py-3 rounded-md text-sm tracking-wide hover:bg-ink/90 transition-colors"
        >
          Inquire about this
        </Link>
      </Reveal>
    </div>
  );
}
