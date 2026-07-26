import { desc, inArray, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { previewUrl } from "@/lib/cloudinary";
import FeaturedGrid from "@/components/FeaturedGrid";
import Reveal from "@/components/Reveal";
import AboutSlider from "@/components/AboutSlider";
import Link from "next/link";
import { PublicAsset } from "@/lib/types";

export const dynamic = "force-dynamic"; // see README: avoids a build-time DB dependency from ISR prerendering

const mapAsset = (a: typeof schema.assets.$inferSelect): PublicAsset => ({
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
});

async function getFeaturedAssets(): Promise<PublicAsset[]> {
  const featuredRows = await db
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.featured, true))
    .orderBy(desc(schema.assets.createdAt))
    .limit(8);

  // Nothing curated yet? Fall back to the most recent uploads so the
  // homepage is never empty before the photographer has picked favorites —
  // but this is a fallback, not the steady state: the admin assets grid
  // has a one-click star to mark real picks once there's a real catalog.
  if (featuredRows.length > 0) return featuredRows.map(mapAsset);

  const recentRows = await db.select().from(schema.assets).orderBy(desc(schema.assets.createdAt)).limit(8);
  return recentRows.map(mapAsset);
}

async function getContent() {
  const rows = await db
    .select()
    .from(schema.siteContent)
    .where(inArray(schema.siteContent.key, ["about", "services", "contact"]));
  const byKey: Record<string, any> = {};
  for (const r of rows) byKey[r.key] = r.value ?? {};
  return {
    about: (byKey.about ?? {}) as { heading?: string; body?: string },
    services: (byKey.services ?? {}) as { heading?: string; body?: string },
    contact: (byKey.contact ?? {}) as { heading?: string; email?: string },
  };
}

async function getTopServices() {
  return db.select().from(schema.services).orderBy(asc(schema.services.sortOrder)).limit(3);
}

async function getAboutImages() {
  const rows = await db.select().from(schema.aboutImages).orderBy(asc(schema.aboutImages.sortOrder));
  return rows.map((img) => ({
    id: img.id,
    caption: img.caption,
    imageUrl: previewUrl(img.imagePublicId),
  }));
}

export default async function HomePage() {
  const [assets, content, topServices, aboutImages] = await Promise.all([
    getFeaturedAssets(),
    getContent(),
    getTopServices(),
    getAboutImages(),
  ]);

  return (
    <div>
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-14 text-center">
        <Reveal>
          <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">Selected Work</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-ink">
            Fine Art &amp; Commercial <span className="italic text-ink">Photography</span>
          </h1>
          <p className="text-ink/50 mt-4 text-sm max-w-lg mx-auto">
            Click any image to view details, purchase a print, or download the full-resolution file.
          </p>
        </Reveal>
      </div>

      {/* Featured work — a curated strip, not the whole catalog; the full
          collection lives on its own /gallery page (browsed, filtered,
          without competing for space against About/Services/Contact). */}
      <div className="max-w-6xl mx-auto px-6 pb-8 scroll-mt-24">
        <FeaturedGrid assets={assets} />
      </div>
      <div className="text-center pb-24">
        <Reveal>
          <Link
            href="/gallery"
            className="inline-block text-xs tracking-widest uppercase text-ink hover:text-ink transition-colors border-b border-ink/40 pb-0.5"
          >
            View full gallery →
          </Link>
        </Reveal>
      </div>

      {/* About preview */}
      <section id="about" className="border-t border-ink/10 bg-white/40 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">The Studio</p>
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-5">
              {content.about.heading ?? "About Photographer Portfolio"}
            </h2>
          </Reveal>

          {aboutImages.length > 0 && (
            <Reveal className="max-w-2xl mx-auto mb-8 text-left">
              <AboutSlider images={aboutImages} autoPlayMs={4500} />
            </Reveal>
          )}

          <Reveal>
            <p className="text-ink/60 leading-relaxed max-w-2xl mx-auto mb-6">
              {content.about.body
                ? content.about.body.split("\n\n")[0]
                : "A closer look at the studio, the philosophy, and the person behind the camera."}
            </p>
            <Link
              href="/about"
              className="inline-block text-xs tracking-widest uppercase text-ink hover:text-ink transition-colors border-b border-ink/40 pb-0.5"
            >
              Read the full story →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Services preview */}
      <section id="services" className="border-t border-ink/10 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">What I Offer</p>
            <h2 className="font-serif text-3xl md:text-4xl text-ink">
              {content.services.heading ?? "Services"}
            </h2>
          </Reveal>

          {topServices.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {topServices.map((s, i) => (
                <Reveal key={s.id} delay={i * 100}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="group block border border-ink/10 rounded-lg p-6 h-full hover:border-graphite/50 hover:shadow-sm transition-all bg-paper"
                  >
                    <h3 className="font-serif text-xl text-ink mb-2">{s.title}</h3>
                    {s.price && <p className="text-ink text-sm mb-3">{s.price}</p>}
                    {s.shortDescription && (
                      <p className="text-ink/50 text-sm leading-relaxed">{s.shortDescription}</p>
                    )}
                    <span className="inline-block mt-4 text-xs tracking-widest uppercase text-ink/50 group-hover:text-ink transition-colors">
                      View details →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="text-center">
              <p className="text-ink/40 text-sm">Services list coming soon — set from the admin dashboard.</p>
            </Reveal>
          )}

          <Reveal className="text-center mt-10">
            <Link
              href="/services"
              className="inline-block text-xs tracking-widest uppercase text-ink hover:text-ink transition-colors border-b border-ink/40 pb-0.5"
            >
              View all services →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="border-t border-ink/10 bg-ink text-paper scroll-mt-16">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-graphite-light mb-3">Get In Touch</p>
            <h2 className="font-serif text-3xl md:text-4xl mb-5">
              {content.contact.heading ?? "Let's create something together"}
            </h2>
            <p className="text-paper/60 mb-8 max-w-md mx-auto">
              Have a project in mind, or just want to ask about a print? Reach out — I'd love to hear from you.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-paper text-ink px-7 py-3 rounded-md text-sm tracking-wide hover:bg-paper/90 transition-colors"
            >
              Contact me
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
