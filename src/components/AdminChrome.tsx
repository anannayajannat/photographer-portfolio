"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/assets/new", label: "Upload new" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/content", label: "Site content" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-black/10 p-6 flex flex-col gap-1">
        <p className="font-serif text-lg tracking-wide mb-1">Photographer Portfolio</p>
        <p className="text-xs text-black/40 uppercase tracking-widest mb-4">Admin</p>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm px-3 py-2 rounded-md ${
              pathname === l.href ? "bg-black/5 font-medium" : "text-black/60 hover:bg-black/5"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-2 rounded-md text-black/60 hover:bg-black/5 mt-4 flex items-center gap-1.5"
        >
          View site ↗
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm px-3 py-2 rounded-md text-left text-black/60 hover:bg-black/5"
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
