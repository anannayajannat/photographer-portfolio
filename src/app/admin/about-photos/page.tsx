"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface AboutImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

export default function AdminAboutPhotosPage() {
  const [images, setImages] = useState<AboutImage[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/about-images")
      .then((r) => r.json())
      .then(setImages);
  }
  useEffect(load, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);

    const res = await fetch("/api/about-images", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      setFile(null);
      setCaption("");
      (document.getElementById("about-photo-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("about-photo-input") as HTMLInputElement).value = "");
      load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Upload failed.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this photo from the About page?")) return;
    const res = await fetch(`/api/about-images/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function move(index: number, direction: -1 | 1) {
    if (!images) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const a = images[index];
    const b = images[targetIndex];
    await Promise.all([
      fetch(`/api/about-images/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/about-images/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">About page photos</h1>
      <p className="text-sm text-black/50 mb-6">
        These appear as a slideshow on your public About page. Add as many as you like — visitors can
        swipe or click through them.
      </p>

      <form onSubmit={handleUpload} className="flex flex-col gap-3 border border-black/10 rounded-lg p-4 mb-8">
        <input
          id="about-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!file || uploading}
          className="self-start bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Add photo"}
        </button>
      </form>

      <p className="text-sm font-medium mb-3">Current photos {images ? `(${images.length})` : ""}</p>
      {!images ? (
        <p className="text-black/50 text-sm">Loading…</p>
      ) : images.length === 0 ? (
        <p className="text-black/40 text-sm">
          No photos yet — add one above and it'll appear on your About page immediately.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <div key={img.id} className="flex items-center gap-3 border border-black/10 rounded-lg p-3">
              <div className="flex flex-col">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="text-black/40 hover:text-black disabled:opacity-20 text-xs leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move down"
                  className="text-black/40 hover:text-black disabled:opacity-20 text-xs leading-none"
                >
                  ▼
                </button>
              </div>
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-black/5 shrink-0">
                <Image src={img.imageUrl} alt={img.caption ?? "About photo"} fill className="object-cover" />
              </div>
              <p className="flex-1 text-sm text-black/60 truncate">{img.caption || "No caption"}</p>
              <button onClick={() => handleDelete(img.id)} className="text-xs text-red-600 hover:underline shrink-0">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
