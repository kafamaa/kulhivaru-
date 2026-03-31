import type { PublicMatchDetail } from "@/src/features/matches/public/queries/get-public-match-detail";

export function MatchInfoBar({ match }: { match: PublicMatchDetail }) {
  // MVP: we only have round_label + tournament status fields, not separate category/phase/group.
  const contextLabel = match.roundLabel ?? "—";
  const venueLabel = match.scheduledAt ? "Venue TBD" : "Venue TBD";

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
              Venue: {venueLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
              Context: {contextLabel}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Status: <span className="font-semibold text-slate-200">{match.status}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

