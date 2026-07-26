import type { Metadata } from "next";
import "./globals.css";

const display = { variable: "--font-display" };
const body = { variable: "--font-body" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: "Photographer Portfolio | Photography",
  description: "Fine art & commercial photography — prints and digital downloads.",
  openGraph: {
    title: "Photographer Portfolio",
    description: "Fine art & commercial photography — prints and digital downloads.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Runs before hydration/paint — sets html.dark based on a saved choice,
  // falling back to the OS-level preference on a first visit. Deliberately
  // NOT using next-themes or any client-only approach here: this needs to
  // run synchronously in <head>, before React even mounts, or there's a
  // visible flash of the wrong theme on every load.
  const themeInitScript = `
    (function () {
      try {
        var stored = localStorage.getItem("theme");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var dark = stored ? stored === "dark" : prefersDark;
        if (dark) document.documentElement.classList.add("dark");
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans">{children}</body>
    </html>
  );
}
