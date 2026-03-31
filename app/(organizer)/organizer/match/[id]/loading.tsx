export default function OrganizerMatchControlLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.12)]">
        <div className="h-6 w-56 animate-pulse rounded bg-white/5" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/5" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
              <div className="mt-3 h-10 w-full animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

