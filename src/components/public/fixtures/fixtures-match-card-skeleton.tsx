export function FixturesMatchCardSkeleton() {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-28 rounded-full bg-white/5" />
          <div className="h-7 w-22 rounded-full bg-white/5" />
          <div className="hidden h-7 w-40 rounded-full bg-white/5 sm:block" />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/5" />
            <div className="h-5 w-24 rounded bg-white/5" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-26 w-36 rounded-2xl bg-white/5" />
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/5" />
            <div className="h-5 w-24 rounded bg-white/5" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-56 rounded bg-white/5" />
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-2xl bg-white/5" />
            <div className="h-9 w-20 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    </article>
  );
}

