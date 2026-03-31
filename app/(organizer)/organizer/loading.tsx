export default function OrganizerLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
        <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
      </div>
    </div>
  );
}
