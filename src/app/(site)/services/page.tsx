import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { db, schema } from "@/lib/db";
import { previewUrl } from "@/lib/cloudinary";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic"; // see README: avoids a build-time DB dependency

export default async function ServicesPage() {
  const [contentRow, services] = await Promise.all([
    db.select().from(schema.siteContent).where(eq(schema.siteContent.key, "services")).then((r) => r[0]),
    db.select().from(schema.services).orderBy(asc(schema.services.sortOrder)),
  ]);
  const content = (contentRow?.value as { heading?: string; body?: string }) ?? {};

  return (
    <div>
      <div className="border-b border-ink/10 bg-paper/60">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">What I Offer</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink mb-4">{content.heading ?? "Services"}</h1>
            {content.body && <p className="text-ink/60 leading-relaxed max-w-xl mx-auto">{content.body}</p>}
          </Reveal>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {services.length === 0 ? (
          <p className="text-ink/40 text-sm text-center">Services coming soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={i * 80}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group block border border-ink/10 rounded-lg overflow-hidden h-full hover:border-ink/30 hover:shadow-sm transition-all"
                >
                  {s.imagePublicId ? (
                    <div className="relative aspect-[16/9] bg-ink/5 overflow-hidden">
                      <Image
                        src={previewUrl(s.imagePublicId)}
                        alt={s.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-serif text-xl text-ink">{s.title}</h3>
                      {s.price && (
                        <span className="text-xs text-ink whitespace-nowrap font-medium">{s.price}</span>
                      )}
                    </div>
                    {s.shortDescription && (
                      <p className="text-ink/50 text-sm leading-relaxed mt-1.5">{s.shortDescription}</p>
                    )}
                    <span className="inline-block mt-4 text-xs tracking-widest uppercase text-ink/60 group-hover:text-ink transition-colors border-b border-ink/30 pb-0.5">
                      View details
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
