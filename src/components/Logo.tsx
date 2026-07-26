export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 group ${className}`}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <circle cx="13" cy="13" r="11.5" stroke="currentColor" strokeWidth="1" className="text-ink/70" />
        <circle cx="13" cy="13" r="7.5" stroke="currentColor" strokeWidth="1" className="text-ink/50" />
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const x1 = 13 + 4 * Math.cos(angle);
          const y1 = 13 + 4 * Math.sin(angle);
          const x2 = 13 + 7.5 * Math.cos(angle);
          const y2 = 13 + 7.5 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="0.75"
              className="text-ink/60"
            />
          );
        })}
        <circle cx="13" cy="13" r="2" fill="currentColor" className="text-ink" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-base sm:text-[1.25rem] tracking-[0.1em] sm:tracking-[0.14em] text-ink">
          PHOTOGRAPHER <span className="italic font-normal text-ink/70">Portfolio</span>
        </span>
        <span className="hidden sm:block text-[0.6rem] tracking-[0.35em] text-ink/40 uppercase mt-0.5">
          Fine Art Photography
        </span>
      </span>
    </span>
  );
}
