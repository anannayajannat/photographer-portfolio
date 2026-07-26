import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic"; // see README: avoids a build-time DB dependency from ISR prerendering

export default async function ContactPage() {
  const [row] = await db.select().from(schema.siteContent).where(eq(schema.siteContent.key, "contact"));
  const value =
    (row?.value as { heading?: string; body?: string; email?: string; phone?: string }) ?? {};

  return (
    <div>
      <div className="border-b border-ink/10 bg-paper/60">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">Get In Touch</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink">{value.heading ?? "Contact"}</h1>
            {value.body && <p className="text-ink/60 leading-relaxed max-w-xl mx-auto mt-4">{value.body}</p>}
          </Reveal>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        <Reveal>
          <h2 className="font-serif text-xl text-ink mb-4">Reach out directly</h2>
          <div className="space-y-3 text-sm">
            {value.email && (
              <p className="flex items-center gap-2 text-ink/70">
                <span className="text-graphite">✉</span>
                <a className="hover:text-ink transition-colors" href={`mailto:${value.email}`}>
                  {value.email}
                </a>
              </p>
            )}
            {value.phone && (
              <p className="flex items-center gap-2 text-ink/70">
                <span className="text-graphite">☎</span> {value.phone}
              </p>
            )}
            {!value.email && !value.phone && (
              <p className="text-ink/40">Contact details coming soon — set this from the admin dashboard.</p>
            )}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="font-serif text-xl text-ink mb-4">Send a message</h2>
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}
