import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold mb-2">Checkout cancelled</h1>
      <p className="text-black/60 text-sm mb-8">No charge was made. You can try again anytime.</p>
      <Link href="/" className="inline-block bg-ink text-white px-6 py-3 rounded-md text-sm">
        Back to gallery
      </Link>
    </div>
  );
}
