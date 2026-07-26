"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface AboutContent {
  heading?: string;
  body?: string;
}

interface AboutImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

export default function AdminAboutPage() {
  const [content, setContent] = useState<AboutContent>({});
  const [savingText, setSavingText] = useState(false);
  const [textSaved, setTextSaved] = useState(false);

  const [images, setImages] = useState<AboutImage[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/content?key=about")
      .then((r) => r.json())
      .then((v) => setContent(v ?? {}));
    loadImages();
  }, []);

  function loadImages() {
    fetch("/api/about-images")
      .then((r) => r.json())
      .then(setImages);
  }

  async function handleSaveText() {
    setSavingText(true);
    setTextSaved(false);
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "about", value: content }),
    });
    setSavingText(false);
    if (res.ok) setTextSaved(true);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);

    const res = await fetch("/api/about-images", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      setFile(null);
      setCaption("");
      const input = document.getElementById("about-photo-input") as HTMLInputElement | null;
      if (input) input.value = "";
      loadImages();
    } else {
      const data = await res.json().catch(() => null);
      setUploadError(data?.error ?? "Upload failed.");
    }
  }

  async function handleDeleteImage(id: string) {
    if (!confirm("Remove this photo from the About page?")) return;
    const res = await fetch(`/api/about-images/${id}`, { method: "DELETE" });
    if (res.ok) loadImages();
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
    loadImages();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">About page</h1>
      <p className="text-sm text-black/50 mb-8">
        Everything shown on your public About page — text and photos — lives here together.
      </p>

      {/* Text content */}
      <section className="mb-10">
        <p className="text-sm font-medium mb-3">Text</p>
        <div className="flex flex-col gap-3">
          <input
            placeholder="Heading"
            value={content.heading ?? ""}
            onChange={(e) => setContent((c) => ({ ...c, heading: e.target.value }))}
            className="border border-black/20 rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Body text — separate paragraphs with a blank line"
            value={content.body ?? ""}
            onChange={(e) => setContent((c) => ({ ...c, body: e.target.value }))}
            rows={6}
            className="border border-black/20 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={handleSaveText}
            disabled={savingText}
            className="self-start bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {savingText ? "Saving…" : "Save text"}
          </button>
          {textSaved && <p className="text-xs text-green-700">Saved.</p>}
        </div>
      </section>

      {/* Photos */}
      <section>
        <p className="text-sm font-medium mb-1">Photos</p>
        <p className="text-xs text-black/50 mb-3">
          These appear as a slideshow on your About page (and a preview on the homepage). Add as many
          as you like.
        </p>

        <form onSubmit={handleUpload} className="flex flex-col gap-3 border border-black/10 rounded-lg p-4 mb-6">
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
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          <button
            type="submit"
            disabled={!file || uploading}
            className="self-start bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Add photo"}
          </button>
        </form>

        {!images ? (
          <p className="text-black/50 text-sm">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-black/40 text-sm">
            No photos yet — add one above and it'll appear immediately.
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
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
