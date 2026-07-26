"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

interface AboutImageItem {
  id: string;
  imageUrl: string;
  caption: string | null;
}

const AUTOPLAY_INTERVAL_MS = 4500;
const RESUME_AFTER_MANUAL_MS = 8000;

export default function AboutSlider({
  images,
}: {
  images: AboutImageItem[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const track = trackRef.current;
    const slide = slideRefs.current[index];

    // Use container-specific scrolling instead of scrollIntoView
    // to prevent the entire browser window from jumping down.
    if (track && slide) {
      track.scrollTo({
        left: slide.offsetLeft,
        behavior: "smooth"
      });
    }
  }

  // Any deliberate action from the visitor pauses autoplay, then quietly
  // resumes after a delay — long enough that it doesn't fight someone
  // mid-browse, short enough that the slider doesn't just stall forever
  // after one click.
  const registerManualInteraction = useCallback((index: number) => {
    scrollToIndex(index);
    setManuallyPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setManuallyPaused(false), RESUME_AFTER_MANUAL_MS);
  }, []);

  useEffect(() => () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  // Autoplay — off entirely for prefers-reduced-motion, and paused while
  // hovered/focused, mid-manual-interaction, or the tab isn't visible.
  useEffect(() => {
    if (images.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (hovered || manuallyPaused) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setActiveIndex((current) => {
        const next = (current + 1) % images.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [images.length, hovered, manuallyPaused]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") registerManualInteraction(Math.min(activeIndex + 1, images.length - 1));
    if (e.key === "ArrowLeft") registerManualInteraction(Math.max(activeIndex - 1, 0));
  }

  if (images.length === 0) return null;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Studio photos"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
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
            <div className="relative w-full aspect-[4/3] sm:aspect-[4/5] rounded-lg overflow-hidden bg-ink/5">
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
          <button
            onClick={() => registerManualInteraction(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            aria-label="Previous photo"
            className="hidden sm:flex absolute left-2 top-[calc(50%-1rem)] -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-paper/90 border border-ink/10 text-ink/60 hover:text-ink disabled:opacity-30 shadow-sm transition-opacity"
          >
            ←
          </button>
          <button
            onClick={() => registerManualInteraction(Math.min(activeIndex + 1, images.length - 1))}
            disabled={activeIndex === images.length - 1}
            aria-label="Next photo"
            className="hidden sm:flex absolute right-2 top-[calc(50%-1rem)] -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-paper/90 border border-ink/10 text-ink/60 hover:text-ink disabled:opacity-30 shadow-sm transition-opacity"
          >
            →
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => registerManualInteraction(i)}
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