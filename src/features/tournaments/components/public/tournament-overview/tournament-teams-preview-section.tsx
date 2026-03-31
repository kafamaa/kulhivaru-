import Image from "next/image";
import Link from "next/link";

interface TeamPreview {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  rankInSelectedGroup: number | null;
}

export function TournamentTeamsPreviewSection({
  slug,
  teamsPreview,
  groupLabel,
}: {
  slug: string;
  teamsPreview: TeamPreview[];
  groupLabel: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Teams</h2>
          <p className="mt-1 text-sm text-slate-400">
            Participants currently listed for this tournament.
          </p>
        </div>
        <Link
          href={`/t/${slug}/teams`}
          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          View All →
        </Link>
      </div>

      {teamsPreview.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400 backdrop-blur-md">
          No teams approved yet.
        </div>
      ) : (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-3 md:overflow-x-visible">
          {teamsPreview.map((t) => (
            <Link
              key={t.teamId}
              href={`/team/${t.teamId}`}
              className="group min-w-[240px] rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:border-emerald-400/30 md:min-w-0"
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {t.logoUrl ? (
                  <Image src={t.logoUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
                    {t.teamName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-3 min-w-0">
                <div className="truncate text-sm font-semibold text-slate-50 group-hover:text-slate-100">
                  {t.teamName}
                </div>
                <div className="mt-1 text-xs text-slate-400">Category: {groupLabel}</div>
                {t.rankInSelectedGroup != null ? (
                  <div className="mt-2 text-xs font-semibold text-emerald-200">
                    Rank #{t.rankInSelectedGroup}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
