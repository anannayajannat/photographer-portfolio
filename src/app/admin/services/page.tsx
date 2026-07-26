"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Service {
  id: string;
  slug: string;
  title: string;
  price: string | null;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

const emptyForm = { title: "", price: "", shortDescription: "", description: "" };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices);
  }

  useEffect(load, []);

  function startEdit(s: Service) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      price: s.price ?? "",
      shortDescription: s.shortDescription ?? "",
      description: s.description ?? "",
    });
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("meta", JSON.stringify(form));
    if (file) formData.append("file", file);

    const url = editingId ? `/api/services/${editingId}` : "/api/services";
    const res = await fetch(url, { method: editingId ? "PUT" : "POST", body: formData });

    setSaving(false);
    if (res.ok) {
      cancelEdit();
      load();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.formErrors?.[0] ?? data?.error ?? "Failed to save.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service? This can't be undone.")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingId === id) cancelEdit();
      load();
    }
  }

  // Swap-based reordering: move this service's sortOrder past its
  // neighbor's. Simple, obvious in the UI, and correct for the list
  // sizes a photographer's services page actually has (a handful, not
  // hundreds) — full drag-and-drop would be more polish than the problem
  // calls for.
  async function move(index: number, direction: -1 | 1) {
    if (!services) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const a = services[index];
    const b = services[targetIndex];

    await Promise.all([
      fetch(`/api/services/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/services/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Services</h1>
      <p className="text-sm text-black/50 mb-6">
        Add, edit, reorder, or remove what shows on your public Services page — no code, no JSON.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 border border-black/10 rounded-lg p-4 mb-8"
      >
        <p className="text-sm font-medium">{editingId ? "Edit service" : "Add a new service"}</p>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title, e.g. Portrait Session"
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
          required
        />
        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder='Price, e.g. "$150" or "From $400" or "Custom quote"'
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
        />
        <input
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          placeholder="Short description — shown on the services list"
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Full description — shown on this service's own page"
          rows={4}
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
        />
        <div>
          <label className="text-xs text-black/50 block mb-1">
            Photo (optional{editingId ? " — leave blank to keep the current one" : ""})
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add service"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-md text-sm text-black/60 hover:bg-black/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <p className="text-sm font-medium mb-3">Current services {services ? `(${services.length})` : ""}</p>
      {!services ? (
        <p className="text-black/50 text-sm">Loading…</p>
      ) : services.length === 0 ? (
        <p className="text-black/40 text-sm">
          Nothing here yet — add your first service above. It'll appear on your public Services page immediately.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {services.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 border border-black/10 rounded-lg p-3"
            >
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
                  disabled={i === services.length - 1}
                  aria-label="Move down"
                  className="text-black/40 hover:text-black disabled:opacity-20 text-xs leading-none"
                >
                  ▼
                </button>
              </div>

              {s.imageUrl && (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-black/5 shrink-0">
                  <Image src={s.imageUrl} alt={s.title} fill className="object-cover" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.title}</p>
                <p className="text-xs text-black/50 truncate">
                  {s.price && <span>{s.price} · </span>}
                  {s.shortDescription || "No short description"}
                </p>
              </div>

              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(s)} className="text-xs text-black/60 hover:underline">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
