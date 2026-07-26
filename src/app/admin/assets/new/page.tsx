"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FileRow {
  file: File;
  title: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
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
    const newRows: FileRow[] = Array.from(fileList).map((file) => ({
      file,
      title: titleFromFilename(file.name),
      progress: 0,
      status: "pending",
    }));
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
          updateRow(index, { status: "done", progress: 100 });
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
          Same category/pricing applies to every file below. Fix individual titles here, or edit any
          asset's other fields afterward.
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
            Titles are auto-filled from each file name — edit any of them below before uploading.
          </p>
          {rows.map((row, i) => (
            <div key={i} className="border border-black/10 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <input
                  aria-label="Photo title"
                  value={row.title}
                  onChange={(e) => updateRow(i, { title: e.target.value })}
                  disabled={row.status === "uploading" || row.status === "done"}
                  className="border border-black/20 rounded-md px-2 py-1 text-sm flex-1"
                />
                <span className="text-xs text-black/40 w-20 truncate">{row.file.name}</span>
                {row.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
                {row.status === "done" && <span className="text-xs text-green-700">✓ Uploaded</span>}
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
          ))}
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
