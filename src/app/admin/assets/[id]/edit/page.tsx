"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface AssetDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  pricingMode: "FREE" | "PAID";
  priceCents: number;
  previewUrl: string;
}

export default function EditAssetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [pricingMode, setPricingMode] = useState<"FREE" | "PAID">("FREE");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/assets/${params.id}`)
      .then((r) => r.json())
      .then((a: AssetDetail) => {
        setAsset(a);
        setTitle(a.title);
        setDescription(a.description ?? "");
        setCategory(a.category);
        setTags(a.tags.join(", "));
        setPricingMode(a.pricingMode);
        setPrice(a.pricingMode === "PAID" ? (a.priceCents / 100).toFixed(2) : "");
      });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      title,
      description: description || undefined,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      pricingMode,
      priceCents: pricingMode === "PAID" ? Math.round(parseFloat(price || "0") * 100) : 0,
    };

    const res = await fetch(`/api/assets/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/admin/assets");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.formErrors?.[0] ?? data?.error ?? "Failed to save changes.");
    }
  }

  if (!asset) return <p className="text-black/50 text-sm">Loading…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Edit asset</h1>

      <div className="relative w-40 aspect-square rounded-md overflow-hidden mb-6 bg-black/5">
        <Image src={asset.previewUrl} alt={asset.title} fill className="object-cover" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
          required
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags, comma separated"
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
        />
        <div className="flex gap-4 items-center text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" checked={pricingMode === "FREE"} onChange={() => setPricingMode("FREE")} />
            Free
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={pricingMode === "PAID"} onChange={() => setPricingMode("PAID")} />
            Paid
          </label>
          {pricingMode === "PAID" && (
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price (USD)"
              className="border border-black/20 rounded-md px-3 py-1.5 text-sm w-32"
              required
            />
          )}
        </div>

        {/* Note: changing the price here only affects future purchases —
            existing PAID orders keep the amountCents they were actually
            charged, which is the correct behavior for a sales record. */}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/assets")}
            className="px-4 py-2 rounded-md text-sm text-black/60 hover:bg-black/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
