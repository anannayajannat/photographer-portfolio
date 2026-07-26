import Link from "next/link";
import Logo from "@/components/Logo";
import Nav from "@/components/Nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
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
        <p className="text-xs tracking-widest text-ink/40 uppercase">
          © {new Date().getFullYear()} Photographer Portfolio — All Rights Reserved
        </p>
      </footer>
    </>
  );
}
