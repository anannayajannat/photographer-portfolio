export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-40 bg-black/10 rounded mb-6" />
      <div className="flex flex-col gap-3 max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-black/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
