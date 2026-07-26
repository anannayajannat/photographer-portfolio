"use client";

import { useState } from "react";

export default function DownloadButton({
  downloadUrl,
  label = "Download full resolution",
}: {
  downloadUrl: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch(downloadUrl);
      const data = await res.json();

      if (!res.ok || !data.url) {
        setState("error");
        return;
      }

      // The API route returns { url: <signed Cloudinary URL> } as JSON —
      // navigate the browser there instead of rendering the JSON itself.
      window.location.href = data.url;
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="inline-block bg-ink text-paper px-7 py-3 rounded-md text-sm tracking-wide hover:bg-ink/90 transition-colors disabled:opacity-60"
      >
        {state === "loading" ? "Preparing your download…" : label}
      </button>
      {state === "error" && (
        <p className="text-red-600 text-xs mt-3">
          Something went wrong fetching your download. Refresh and try again, or contact support if it persists.
        </p>
      )}
    </div>
  );
}
