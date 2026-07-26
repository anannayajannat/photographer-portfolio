import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import Reveal from "@/components/Reveal";
import AboutSlider from "@/components/AboutSlider";
import { previewUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic"; // see README: avoids a build-time DB dependency from ISR prerendering

export default async function AboutPage() {
  const [contentRow, imageRows] = await Promise.all([
    db.select().from(schema.siteContent).where(eq(schema.siteContent.key, "about")).then((r) => r[0]),
    db.select().from(schema.aboutImages).orderBy(asc(schema.aboutImages.sortOrder)),
  ]);
  const value = (contentRow?.value as { heading?: string; body?: string }) ?? {};
  const images = imageRows.map((img) => ({
    id: img.id,
    caption: img.caption,
    imageUrl: previewUrl(img.imagePublicId),
  }));

  return (
    <div>
      <div className="border-b border-ink/10 bg-white/40">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">The Studio</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink">{value.heading ?? "About"}</h1>
          </Reveal>
        </div>
      </div>

      {images.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pt-14">
          <Reveal>
            <AboutSlider images={images} />
          </Reveal>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-16">
        {value.body ? (
          value.body.split("\n\n").map((p, i) => (
            <Reveal key={i} delay={i * 80}>
              <p className="text-ink/70 leading-relaxed mb-5 text-[0.975rem]">{p}</p>
            </Reveal>
          ))
        ) : (
          <p className="text-ink/40 text-sm">Content coming soon — set this from the admin dashboard.</p>
        )}
      </div>
    </div>
  );
}
