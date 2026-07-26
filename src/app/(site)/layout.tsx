import Link from "next/link";
import { eq } from "drizzle-orm";
import Logo from "@/components/Logo";
import Nav from "@/components/Nav";
import { db, schema } from "@/lib/db";
import { InstagramIcon, FacebookIcon, YoutubeIcon, PinterestIcon, XIcon } from "@/components/SocialIcons";

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  pinterest?: string;
  x?: string;
}

const SOCIAL_ICONS: { key: keyof SocialLinks; label: string; Icon: typeof InstagramIcon }[] = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "youtube", label: "YouTube", Icon: YoutubeIcon },
  { key: "pinterest", label: "Pinterest", Icon: PinterestIcon },
  { key: "x", label: "X (Twitter)", Icon: XIcon },
];

async function getSocialLinks(): Promise<SocialLinks> {
  const [row] = await db.select().from(schema.siteContent).where(eq(schema.siteContent.key, "social"));
  return (row?.value as SocialLinks) ?? {};
}

export const dynamic = "force-dynamic"; // see README: avoids a build-time DB dependency

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const social = await getSocialLinks();
  const activeSocials = SOCIAL_ICONS.filter(({ key }) => social[key]);

  return (
    <>
      <header className="border-b border-ink/10 sticky top-0 bg-paper/90 backdrop-blur z-40 h-[65px]">
        <nav className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
          <Nav />
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-ink/10 py-10 text-center bg-paper">
        <div className="flex justify-center mb-4 opacity-80 scale-90">
          <Logo />
        </div>
        <div className="flex justify-center gap-6 text-xs tracking-widest text-ink/50 uppercase mb-4">
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/services" className="hover:text-ink">Services</Link>
          <Link href="/contact" className="hover:text-ink">Contact</Link>
        </div>
        {activeSocials.length > 0 && (
          <div className="flex justify-center gap-5 mb-5">
            {activeSocials.map(({ key, label, Icon }) => (
              <a
                key={key}
                href={social[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-ink/50 hover:text-ink transition-colors"
              >
                <Icon className="w-[18px] h-[18px]" />
              </a>
            ))}
          </div>
        )}
        <p className="text-xs tracking-widest text-ink/40 uppercase">
          © {new Date().getFullYear()} Photographer Portfolio — All Rights Reserved
        </p>
      </footer>
    </>
  );
}
