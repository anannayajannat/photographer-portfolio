"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { PublicAsset } from "@/lib/types";
import PurchasePanel from "./PurchasePanel";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Lightbox({
  asset,
  onClose,
}: {
  asset: PublicAsset;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Remember what had focus before the modal opened, so closing it
    // (Escape or the close button) returns focus there instead of
    // dropping it back to <body> — a jarring loss of place for anyone
    // navigating by keyboard or screen reader.
    triggerElementRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Basic focus trap: Tab/Shift+Tab cycles within the dialog instead
      // of escaping into the page content sitting behind the overlay.
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      triggerElementRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        className="max-w-4xl w-full bg-paper rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
          <Image
            src={asset.previewUrl}
            alt={asset.description ? `${asset.title} — ${asset.description}` : asset.title}
            fill
            className="object-contain select-none"
            draggable={false}
          />
        </div>
        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 id="lightbox-title" className="text-xl font-semibold">
                {asset.title}
              </h3>
              <p className="text-sm text-ink/60">{asset.category}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/photo/${asset.id}`}
                className="text-xs text-ink/50 hover:text-black underline"
                title="Permalink to this photo"
              >
                Share
              </Link>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close"
                className="text-sm text-ink/50 hover:text-ink"
              >
                Close ✕
              </button>
            </div>
          </div>
          {asset.description && <p className="text-sm text-ink/70">{asset.description}</p>}

          <PurchasePanel asset={asset} />
        </div>
      </div>
    </div>
  );
}
