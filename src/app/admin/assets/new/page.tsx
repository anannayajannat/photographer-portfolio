"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FileRow {
  file: File;
  title: string;
  savedTitle: string; // last title actually persisted to the server — diverges from `title` while editing
  assetId: string | null; // set once the upload succeeds, needed to PATCH a rename afterward
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  renameStatus: "idle" | "saving" | "saved" | "error";
  error?: string;
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
}

export default function AdminUploadPage() {
  const router = useRouter();
  const [rows, setRows] = useState<FileRow[]>([]);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [pricingMode, setPricingMode] = useState<"FREE" | "PAID">("FREE");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const newRows: FileRow[] = Array.from(fileList).map((file) => {
      const title = titleFromFilename(file.name);
      return {
        file,
        title,
        savedTitle: title,
        assetId: null,
        progress: 0,
        status: "pending",
        renameStatus: "idle",
      };
    });
    setRows((prev) => [...prev, ...newRows]);
  }

  function updateRow(index: number, patch: Partial<FileRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  // Uploads one file via XHR (for progress events) against the existing,
  // already-hardened single-file /api/upload route. Deliberately not
  // rewriting that route into a multipart-batch endpoint under deadline
  // pressure — it's already reviewed (auth, magic-byte check, size limit),
  // so looping client-side reuses all of that instead of re-implementing it.
  function uploadOne(index: number, row: FileRow): Promise<void> {
    return new Promise((resolve) => {
      updateRow(index, { status: "uploading", progress: 0, error: undefined });

      const meta = {
        title: row.title,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        pricingMode,
        priceCents: pricingMode === "PAID" ? Math.round(parseFloat(price || "0") * 100) : 0,
      };

      const formData = new FormData();
      formData.append("file", row.file);
      formData.append("meta", JSON.stringify(meta));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) updateRow(index, { progress: Math.round((e.loaded / e.total) * 100) });
      };
      xhr.onload = () => {
        if (xhr.status === 201) {
          let assetId: string | null = null;
          try {
            assetId = JSON.parse(xhr.responseText).id ?? null;
          } catch {}
          updateRow(index, { status: "done", progress: 100, assetId, savedTitle: row.title });
        } else {
          let msg = "Upload failed.";
          try {
            msg = JSON.parse(xhr.responseText).error ?? msg;
          } catch {}
          updateRow(index, { status: "error", error: typeof msg === "string" ? msg : "Upload failed." });
        }
        resolve();
      };
      xhr.onerror = () => {
        updateRow(index, { status: "error", error: "Network error." });
        resolve();
      };
      xhr.send(formData);
    });
  }

  // Renaming after the fact reuses the same full-metadata PUT the standalone
  // edit page uses — the API only accepts a complete metadata object, not a
  // partial patch, so this resends the category/pricing this batch already
  // used alongside the corrected title.
  async function handleRename(index: number, row: FileRow) {
    if (!row.assetId || row.title === row.savedTitle) return;
    updateRow(index, { renameStatus: "saving" });

    const body = {
      title: row.title,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      pricingMode,
      priceCents: pricingMode === "PAID" ? Math.round(parseFloat(price || "0") * 100) : 0,
    };

    const res = await fetch(`/api/assets/${row.assetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      updateRow(index, { renameStatus: "saved", savedTitle: row.title });
      setTimeout(() => updateRow(index, { renameStatus: "idle" }), 1500);
    } else {
      updateRow(index, { renameStatus: "error" });
    }
  }

  async function handleUploadAll() {
    if (rows.length === 0) return;
    if (!category) {
      alert("Set a category first — it applies to every file in this batch.");
      return;
    }
    setUploading(true);

    // Sequential, not Promise.all: a burst of large concurrent uploads
    // would compete for bandwidth and make every progress bar crawl
    // together instead of one file finishing at a time. Sequential is
    // slower in total but gives clearer, more honest per-file feedback —
    // the right tradeoff for an admin uploading a shoot's worth of images,
    // not a user-facing bulk-import pipeline optimizing for throughput.
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === "done") continue; // allow re-running after partial failure
      await uploadOne(i, rows[i]);
    }

    setUploading(false);
  }

  const allDone = rows.length > 0 && rows.every((r) => r.status === "done");
  const anyErrors = rows.some((r) => r.status === "error");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Upload new assets</h1>

      <div className="flex flex-col gap-3 mb-6 border border-black/10 rounded-lg p-4">
        <p className="text-sm font-medium">Shared for this batch</p>
        <input
          placeholder="Category (e.g. Portrait, Landscape)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-black/20 rounded-md px-3 py-2 text-sm"
          required
        />
        <input
          placeholder="Tags, comma separated"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
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
              placeholder="Price (USD)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-black/20 rounded-md px-3 py-1.5 text-sm w-32"
              required
            />
          )}
        </div>
        <p className="text-xs text-black/40">
          Same category/pricing applies to every file below. Titles can be renamed both before and
          after upload.
        </p>
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="text-sm mb-4"
      />

      {rows.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <p className="text-xs text-black/40">
            Titles are auto-filled from each file name — edit any of them, before or after upload.
          </p>
          {rows.map((row, i) => {
            const isDirty = row.status === "done" && row.title !== row.savedTitle;
            return (
              <div key={i} className="border border-black/10 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <input
                    aria-label="Photo title"
                    value={row.title}
                    onChange={(e) => updateRow(i, { title: e.target.value })}
                    disabled={row.status === "uploading"}
                    className="border border-black/20 rounded-md px-3 py-2 text-sm flex-1 min-w-0"
                  />
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-black/40 truncate max-w-[140px]" title={row.file.name}>
                      {row.file.name}
                    </span>

                  {row.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}

                  {row.status === "done" && isDirty && (
                    <button
                      type="button"
                      onClick={() => handleRename(i, row)}
                      disabled={row.renameStatus === "saving"}
                      className="text-xs bg-ink text-white px-2.5 py-1 rounded-md disabled:opacity-50"
                    >
                      {row.renameStatus === "saving" ? "Saving…" : "Save title"}
                    </button>
                  )}
                  {row.status === "done" && !isDirty && row.renameStatus === "saved" && (
                    <span className="text-xs text-green-700">✓ Saved</span>
                  )}
                  {row.status === "done" && !isDirty && row.renameStatus === "idle" && (
                    <span className="text-xs text-green-700">✓ Uploaded</span>
                  )}
                  {row.renameStatus === "error" && (
                    <span className="text-xs text-red-600">Rename failed — try again</span>
                  )}

                  {row.status === "error" && (
                    <button
                      type="button"
                      onClick={() => uploadOne(i, row)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Retry
                    </button>
                  )}
                  </div>
                </div>
                {row.status === "uploading" && (
                  <div className="w-full bg-black/10 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-ink h-1.5 rounded-full transition-all"
                      style={{ width: `${row.progress}%` }}
                    />
                  </div>
                )}
                {row.status === "error" && <p className="text-xs text-red-600 mt-1">{row.error}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3 items-center">
        <button
          onClick={handleUploadAll}
          disabled={rows.length === 0 || uploading}
          className="bg-ink text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
        >
          {uploading ? "Uploading…" : `Upload ${rows.length || ""} file${rows.length === 1 ? "" : "s"}`}
        </button>
        {allDone && !anyErrors && (
          <button
            onClick={() => router.push("/admin/assets")}
            className="text-sm text-black/60 hover:underline"
          >
            Done — view assets →
          </button>
        )}
        {anyErrors && !uploading && (
          <span className="text-xs text-red-600">
            Some files failed — fix and retry individually, or continue with the rest.
          </span>
        )}
      </div>
    </div>
  );
}
