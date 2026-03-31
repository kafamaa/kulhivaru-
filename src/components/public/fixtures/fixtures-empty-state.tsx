import Link from "next/link";

export function FixturesEmptyState({
  slug,
  variant,
}: {
  slug: string;
  variant: "no-matches" | "no-live";
}) {
  if (variant === "no-live") {
    return (
      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <div className="text-lg font-semibold text-slate-50">No live matches right now</div>
        <p className="mt-2 text-sm text-slate-400">
          Check back later, or view today&apos;s fixtures.
        </p>
        <div className="mt-7 flex justify-center gap-3 flex-wrap">
          <Link
            href={`/t/${slug}/fixtures?tab=all&date=today`}
            className="inline-flex items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-6 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
          >
            View Today →
          </Link>
          <Link
            href={`/t/${slug}/fixtures?tab=all`}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Browse Fixtures
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
      <div className="text-lg font-semibold text-slate-50">No matches found</div>
      <p className="mt-2 text-sm text-slate-400">
        Try clearing filters to see more fixtures.
      </p>
      <div className="mt-7 flex justify-center gap-3 flex-wrap">
        <Link
          href={`/t/${slug}/fixtures`}
          className="inline-flex items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-6 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
        >
          Clear filters →
        </Link>
      </div>
    </div>
  );
}

