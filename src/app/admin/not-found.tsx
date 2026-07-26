import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="max-w-md py-16">
      <p className="text-xs tracking-widest uppercase text-black/40 mb-2">404</p>
      <h1 className="text-2xl font-semibold mb-3">Page not found</h1>
      <p className="text-black/50 text-sm mb-6">
        There's no admin page at this address. Check the URL, or head back to the dashboard.
      </p>
      <Link href="/admin" className="inline-block bg-ink text-white px-4 py-2 rounded-md text-sm">
        Back to overview
      </Link>
    </div>
  );
}
