"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Key = "contact" | "services" | "social";

interface ContentValue {
  heading?: string;
  body?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  pinterest?: string;
  x?: string;
}

const TABS: { key: Key; label: string }[] = [
  { key: "contact", label: "Contact" },
  { key: "services", label: "Services intro" },
  { key: "social", label: "Social links" },
];

const SOCIAL_FIELDS: { key: keyof ContentValue; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/yourhandle" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
];

const EMPTY: Record<Key, ContentValue> = { contact: {}, services: {}, social: {} };

export default function AdminContentPage() {
  const [active, setActive] = useState<Key>("contact");
  const [values, setValues] = useState<Record<Key, ContentValue>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((rows: { key: string; value: any }[]) => {
        const next = { ...EMPTY };
        for (const row of rows) {
          if (row.key === "contact" || row.key === "services" || row.key === "social") {
            next[row.key] = row.value ?? {};
          }
        }
        setValues(next);
      });
  }, []);

  function update(field: keyof ContentValue, val: string) {
    setValues((prev) => ({ ...prev, [active]: { ...prev[active], [field]: val } }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const current = values[active];

    let value: any;
    if (active === "social") {
      value = Object.fromEntries(SOCIAL_FIELDS.map((f) => [f.key, current[f.key] ?? ""]));
    } else {
      value = { heading: current.heading, body: current.body };
      if (active === "contact") value = { ...value, email: current.email, phone: current.phone };
    }

    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: active, value }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  const v = values[active];

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Site content</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              active === t.key ? "bg-ink text-white border-ink" : "border-black/15"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "social" ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-black/40 -mt-1 mb-1">
            Leave any field blank to hide that icon from the site footer. Full URLs only (e.g.
            "https://instagram.com/yourhandle", not just "yourhandle").
          </p>
          {SOCIAL_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-black/50 block mb-1">{f.label}</label>
              <input
                value={v[f.key] ?? ""}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="border border-black/20 rounded-md px-3 py-2 text-sm w-full"
              />
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 mt-2"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <p className="text-xs text-green-700">Saved.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            placeholder="Heading"
            value={v.heading ?? ""}
            onChange={(e) => update("heading", e.target.value)}
            className="border border-black/20 rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Body text"
            value={v.body ?? ""}
            onChange={(e) => update("body", e.target.value)}
            rows={6}
            className="border border-black/20 rounded-md px-3 py-2 text-sm"
          />
          {active === "contact" && (
            <>
              <input
                placeholder="Email"
                value={v.email ?? ""}
                onChange={(e) => update("email", e.target.value)}
                className="border border-black/20 rounded-md px-3 py-2 text-sm"
              />
              <input
                placeholder="Phone"
                value={v.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                className="border border-black/20 rounded-md px-3 py-2 text-sm"
              />
            </>
          )}
          {active === "services" && (
            <p className="text-xs text-black/40">
              This is just the intro text at the top of your Services page. To add, edit, reorder, or
              remove individual services, go to{" "}
              <Link href="/admin/services" className="underline">
                Services
              </Link>{" "}
              in the sidebar.
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <p className="text-xs text-green-700">Saved.</p>}
        </div>
      )}
    </div>
  );
}
