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
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left Side: Photo Slider (Stacks below text on mobile) */}
        <div className="order-2 md:order-1 w-full">
          {images.length > 0 ? (
            <Reveal>
              <AboutSlider images={images} />
            </Reveal>
          ) : (
            <Reveal>
              <div className="aspect-[4/5] bg-black/5 flex items-center justify-center rounded-md">
                <p className="text-ink/40 text-sm">No images uploaded yet.</p>
              </div>
            </Reveal>
          )}
        </div>

        {/* Right Side: Written Section (Stacks above image on mobile) */}
        <div className="order-1 md:order-2 space-y-8">
          <Reveal>
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">
                The Studio
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-ink leading-tight">
                {value.heading ?? "About"}
              </h1>
            </div>
          </Reveal>

          <div className="space-y-6">
            {value.body ? (
              value.body.split("\n\n").map((p, i) => (
                <Reveal key={i} delay={i * 80}>
                  <p className="text-ink/70 leading-relaxed text-[1.05rem] font-sans">
                    {p}
                  </p>
                </Reveal>
              ))
            ) : (
              <Reveal>
                <p className="text-ink/40 text-sm font-sans">
                  Content coming soon — set this from the admin dashboard.
                </p>
              </Reveal>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}