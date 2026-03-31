import Link from "next/link";

export function EmptyStatePanel() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <svg className="h-6 w-6 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 15a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M7 10h10" />
          <path d="M7 14h6" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-50">
        No tournaments found
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        Try changing your filters or search term.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/explore"
          className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Back to all tournaments
        </Link>
      </div>
    </div>
  );
}

