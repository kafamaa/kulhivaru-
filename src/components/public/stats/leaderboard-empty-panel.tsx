import Link from "next/link";

export function LeaderboardEmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <span className="text-xl">★</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-50">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link
          href="/stats"
          className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Clear Filters
        </Link>
      </div>
    </div>
  );
}

