export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse">
      <div className="h-3 w-24 bg-ink/10 rounded mb-4 mx-auto" />
      <div className="h-8 w-64 bg-ink/10 rounded mb-12 mx-auto" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-ink/5 rounded-md" />
        ))}
      </div>
    </div>
  );
}
