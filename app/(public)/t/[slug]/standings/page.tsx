import Link from "next/link";

import { TournamentSubNav } from "@/src/features/tournaments/components/public/tournament-overview/tournament-sub-nav";
import { StandingsSelectors } from "@/src/features/standings/components/public/standings-selectors";
import { StandingsTable } from "@/src/features/standings/components/public/standings-table";
import { TieBreakExplanation } from "@/src/features/standings/components/public/tie-break-explanation";
import { StandingsLegend } from "@/src/features/standings/components/public/standings-legend";
import {
  getPublicTournamentStandings,
  type TournamentStandingsPhaseKey,
} from "@/src/features/standings/queries/get-public-tournament-standings";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parsePhase(input: string | undefined): TournamentStandingsPhaseKey {
  if (input === "knockout" || input === "finals" || input === "group-stage") return input;
  return "group-stage";
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const cls =
    status === "ongoing"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : status === "upcoming"
        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
        : "border-white/10 bg-white/5 text-slate-300";

  const label =
    status === "ongoing" ? "Ongoing" : status === "upcoming" ? "Upcoming" : "Completed";

  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

interface FixturesPageProps {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<SearchParamsValue | undefined>
    | SearchParamsValue
    | undefined;
}

export default async function TournamentStandingsPage({ params, searchParams }: FixturesPageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const phase = parsePhase(getString(sp, "phase"));
  const groupParam = getString(sp, "group") ?? "overall";

  try {
    const data = await getPublicTournamentStandings({
      slug,
      phase,
      groupId: groupParam,
    });

    const rows = data.rows;

    const summary = rows.length > 0 ? `${rows.length} Teams` : "Standings";

    return (
      <div className="space-y-6">
        {/* 2. Tournament Header (compact) */}
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/t/${slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    ← Overview
                  </Link>
                  <span className="text-sm font-semibold text-slate-50 truncate">
                    Standings · {data.tournament.name}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {summary}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={data.tournament.status} />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Tournament Sub-navigation */}
        <TournamentSubNav slug={slug} active="standings" />

        {/* 4. Standings Header + Controls */}
        <section className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-50">Standings</h2>
              <p className="mt-1 text-sm text-slate-400">
                Official ranking table (powered by your `standings_cache`).
              </p>
            </div>
            {rows.length > 0 ? (
              <div className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-50 tabular-nums">
                  {rows.length}
                </span>{" "}
                teams.
              </div>
            ) : null}
          </div>
        </section>

        {/* 5. Category / Phase / Group selectors */}
        <StandingsSelectors
          initial={{
            phase,
            groupKey: groupParam,
          }}
          phaseOptions={data.phaseOptions}
          groupOptions={data.groupOptions}
        />

        {/* 6. Table + tie-break + legend */}
        <section className="mx-auto max-w-7xl px-4 pb-12">
          {rows.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
              <div className="text-xl font-semibold text-slate-50">
                Standings not available yet
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Matches need to be played to generate standings.
              </p>
            </div>
          ) : (
            <>
              <StandingsTable rows={rows} />
              <div className="mt-4">
                <TieBreakExplanation />
              </div>
              <StandingsLegend />
              <p className="mt-3 text-xs text-amber-200">
                Qualification colors are MVP-derived from rank (no stored qualification rules yet).
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                <Link
                  href={`/t/${slug}/fixtures`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-semibold text-slate-200 hover:bg-white/10"
                >
                  Go to Fixtures →
                </Link>
                <Link
                  href={`/t/${slug}/stats`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-semibold text-slate-200 hover:bg-white/10"
                >
                  View Stats →
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return (
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
          <h3 className="text-2xl font-semibold text-red-100">Couldn&apos;t load standings</h3>
          <p className="mt-2 text-sm text-red-200/90">{message}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
            >
              Retry
            </button>
            <Link
              href={`/t/${slug}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

