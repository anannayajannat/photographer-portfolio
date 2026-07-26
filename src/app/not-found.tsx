import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-32 text-center">
      <p className="text-xs tracking-[0.3em] uppercase text-graphite mb-3">404</p>
      <h1 className="font-serif text-3xl text-ink mb-4">Page not found</h1>
      <Link
        href="/"
        className="inline-block bg-ink text-paper px-6 py-3 rounded-md text-sm tracking-wide hover:bg-ink/90 transition-colors"
      >
        Back to homepage
      </Link>
    </div>
  );
}
