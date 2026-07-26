"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  // Prevent the page behind the mobile menu from scrolling while it's open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop: full inline nav, hidden below md */}
      <div className="hidden md:flex gap-8 text-xs tracking-[0.15em] uppercase text-ink/70">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-ink transition-colors duration-300">
            {l.label}
          </Link>
        ))}
      </div>

      {/* Mobile: hamburger, hidden at md and above */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        className="md:hidden relative w-8 h-8 flex flex-col justify-center items-center gap-1.5 z-50"
      >
        <span
          className={`block w-6 h-px bg-ink transition-transform duration-300 ${
            open ? "rotate-45 translate-y-[3.5px]" : ""
          }`}
        />
        <span
          className={`block w-6 h-px bg-ink transition-transform duration-300 ${
            open ? "-rotate-45 -translate-y-[3.5px]" : ""
          }`}
        />
      </button>

      {/* Mobile panel with Glassmorphism */}
      {open && (
        <div
          id="mobile-nav-panel"
          className="md:hidden fixed inset-x-0 top-[65px] bottom-0 bg-paper/80 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 border-t border-ink/5"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-lg tracking-[0.2em] uppercase text-ink/80 hover:text-ink transition-colors duration-300"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}