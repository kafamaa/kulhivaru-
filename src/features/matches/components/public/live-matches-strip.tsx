import Link from "next/link";
import type { PublicMatchPreview } from "../../types";

interface LiveMatchesStripProps {
  matches: PublicMatchPreview[];
}

export function LiveMatchesStrip({ matches }: LiveMatchesStripProps) {
  if (matches.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400">
        No live matches right now. When tournaments go live, key fixtures will
        show here in real time.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">
      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-medium uppercase tracking-wide">
          Live & upcoming
        </span>
        <Link
          href="/matches"
          className="text-emerald-300 hover:text-emerald-200"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/t/${m.tournamentSlug}`}
            className="min-w-[220px] rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-emerald-500/70 transition-colors"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="truncate text-[10px] text-slate-400">
                {m.tournamentName}
              </span>
              <span className="text-[10px] text-emerald-300">
                {m.statusLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="truncate text-slate-100">{m.homeTeam}</span>
              <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[11px] font-semibold">
                {m.score ?? "-"}
              </span>
              <span className="truncate text-slate-100 text-right">
                {m.awayTeam}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

