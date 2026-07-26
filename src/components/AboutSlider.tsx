"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface AboutImageItem {
  id: string;
  imageUrl: string;
  caption: string | null;
}

export default function AboutSlider({
  images,
  autoPlayMs,
}: {
  images: AboutImageItem[];
  /** If set, auto-advances to the next slide every N ms. Any manual
   *  navigation (arrows, dots, swipe) naturally resets the countdown,
   *  since it's re-scheduled from the current activeIndex below. */
  autoPlayMs?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track which slide is centered using IntersectionObserver rather than
  // computing it from scrollLeft — robust to scroll-snap's native momentum
  // easing, which makes raw-position math unreliable mid-swipe.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) setActiveIndex(index);
          }
        }
      },
      { root: track, threshold: 0.6 }
    );

    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [images.length]);

  function scrollToIndex(index: number) {
    const slide = slideRefs.current[index];
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") scrollToIndex(Math.min(activeIndex + 1, images.length - 1));
    if (e.key === "ArrowLeft") scrollToIndex(Math.max(activeIndex - 1, 0));
  }

  // One-shot timeout re-scheduled every time activeIndex changes (by
  // autoplay itself, or by the user clicking/swiping) — simpler and less
  // bug-prone than a setInterval fighting a closure over a stale index.
  useEffect(() => {
    if (!autoPlayMs || images.length <= 1) return;
    const timer = setTimeout(() => {
      scrollToIndex((activeIndex + 1) % images.length);
    }, autoPlayMs);
    return () => clearTimeout(timer);
  }, [activeIndex, autoPlayMs, images.length]);

  if (images.length === 0) return null;

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label="Studio photos">
      <div
        ref={trackRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ink/30 rounded-lg"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="relative shrink-0 w-full snap-center"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${images.length}`}
          >
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-lg overflow-hidden bg-black/5">
              <Image
                src={img.imageUrl}
                alt={img.caption ?? "Studio photo"}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            </div>
            {img.caption && (
              <p className="text-center text-xs text-ink/40 mt-2 tracking-wide">{img.caption}</p>
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          {/* Arrow controls — hidden on the smallest screens where swipe is the primary interaction */}
          <button
            onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            aria-label="Previous photo"
            className="hidden sm:flex absolute left-2 top-[calc(50%-1rem)] -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-paper/90 border border-ink/10 text-ink/60 hover:text-ink disabled:opacity-30 shadow-sm"
          >
            ←
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(activeIndex + 1, images.length - 1))}
            disabled={activeIndex === images.length - 1}
            aria-label="Next photo"
            className="hidden sm:flex absolute right-2 top-[calc(50%-1rem)] -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-paper/90 border border-ink/10 text-ink/60 hover:text-ink disabled:opacity-30 shadow-sm"
          >
            →
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === activeIndex}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}