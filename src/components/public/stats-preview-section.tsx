import Image from "next/image";
import Link from "next/link";

export interface TopScorerPreview {
  id: string;
  name: string;
  teamName: string;
  imageUrl?: string | null;
  teamSlug?: string;
  goals: number;
  tournamentName?: string;
}

export interface StandingsRowPreview {
  rank: number;
  teamName: string;
  teamId?: string;
  points: number;
  played: number;
  logoUrl?: string | null;
}

interface StatsPreviewSectionProps {
  topScorers?: TopScorerPreview[];
  standingsPreview?: StandingsRowPreview[];
  isLoading?: boolean;
}

export function StatsPreviewSection({
  topScorers = [],
  standingsPreview = [],
  isLoading = false,
}: StatsPreviewSectionProps) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="mb-3 h-6 w-40 animate-pulse rounded bg-slate-900/70" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-slate-900/70" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-900/70" />
          </div>
        </div>
      </section>
    );
  }

  const hasScorers = topScorers.length > 0;
  const hasStandings = standingsPreview.length > 0;
  if (!hasScorers && !hasStandings) return null;

  function initials(name: string) {
    return name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
        <h2 className="mb-4 text-lg font-semibold text-slate-50">
          Quick stats
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {hasScorers && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Top scorers
            </h3>
            <ul className="space-y-2">
              {topScorers.slice(0, 5).map((p, i) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 text-slate-500">{i + 1}</span>
                    <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[10px] font-bold text-slate-200">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                      ) : (
                        initials(p.name)
                      )}
                    </span>
                    <span className="truncate font-medium text-slate-100">{p.name}</span>
                    <span className="truncate text-slate-400">· {p.teamName}</span>
                  </div>
                  <span className="font-semibold text-emerald-400">{p.goals} G</span>
                </li>
              ))}
            </ul>
            <Link
              href="/explore?tab=stats"
              className="mt-3 inline-block text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              View full stats →
            </Link>
            </div>
          )}
          {hasStandings && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Standings preview
            </h3>
            <div className="overflow-hidden rounded-xl border border-white/10 text-xs">
              <div className="grid grid-cols-4 gap-2 border-b border-white/10 bg-white/5 px-3 py-2 text-slate-400">
                <span>#</span>
                <span className="col-span-2">Team</span>
                <span className="text-right">Pts</span>
              </div>
              {standingsPreview.slice(0, 5).map((row) => (
                <div
                  key={row.teamName + row.rank}
                  className="grid grid-cols-4 gap-2 border-t border-white/10 px-3 py-2"
                >
                  <span className="text-slate-500">{row.rank}</span>
                  <span className="col-span-2 flex min-w-0 items-center gap-2 truncate text-slate-100">
                    <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[9px] font-bold text-slate-200">
                      {row.logoUrl ? (
                        <Image src={row.logoUrl} alt={row.teamName} fill className="object-cover" />
                      ) : (
                        initials(row.teamName)
                      )}
                    </span>
                    <span className="truncate">{row.teamName}</span>
                  </span>
                  <span className="text-right font-medium text-emerald-300">
                    {row.points}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/explore?tab=standings"
              className="mt-3 inline-block text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              View all standings →
            </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
