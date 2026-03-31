import Link from "next/link";
import { searchPublicTournaments } from "@/src/features/search/queries/search-public-tournaments";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? "").toString();
  const results = q ? await searchPublicTournaments({ q }) : [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-50">Search</h1>
        <p className="text-sm text-slate-400">
          Find tournaments by name, sport, organizer, or location.
        </p>
      </header>

      <form action="/search" method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search tournaments…"
          className="w-full max-w-xl rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Search
        </button>
      </form>

      {!q ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">
          Start typing to search public tournaments.
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">
          No tournaments matched <span className="font-medium">“{q}”</span>.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {results.map((t) => (
            <Link
              key={t.id}
              href={`/t/${t.slug}`}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {t.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.organizerName ?? "Organizer"} · {t.sport}
                    {t.location ? ` · ${t.location}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                  {t.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5">
                  Teams: {t.teamCount ?? 0}
                </span>
                {t.startDate ? (
                  <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5">
                    Starts: {t.startDate}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

