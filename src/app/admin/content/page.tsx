"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Key = "about" | "contact" | "services";

interface ContentValue {
  heading?: string;
  body?: string;
  email?: string;
  phone?: string;
}

const TABS: { key: Key; label: string }[] = [
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
  { key: "services", label: "Services intro" },
];

export default function AdminContentPage() {
  const [active, setActive] = useState<Key>("about");
  const [values, setValues] = useState<Record<Key, ContentValue>>({
    about: {},
    contact: {},
    services: {},
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((rows: { key: Key; value: any }[]) => {
        const next = { about: {}, contact: {}, services: {} } as Record<Key, ContentValue>;
        for (const row of rows) next[row.key] = row.value ?? {};
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
    let value: any = { heading: current.heading, body: current.body };
    if (active === "contact") {
      value = { ...value, email: current.email, phone: current.phone };
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
      <div className="flex gap-2 mb-6">
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
    </div>
  );
}
