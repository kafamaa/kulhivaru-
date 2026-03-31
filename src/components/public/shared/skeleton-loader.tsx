export function SkeletonLoader({
  lines = 5,
}: {
  lines?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="h-10 w-48 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-6 w-full animate-pulse rounded-2xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

