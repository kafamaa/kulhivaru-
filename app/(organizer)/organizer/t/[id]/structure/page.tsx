import Link from "next/link";
import { getOrganizerTournamentStructure } from "@/src/features/organizer/queries/get-organizer-tournament-structure";
import { ManualFixtureCreateCard } from "@/src/features/organizer/components/manual-fixture-create-card";

interface OrganizerTournamentStructurePageProps {
  params: Promise<{ id: string }>;
}

function badge(status: string): string {
  if (status === "ongoing") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "upcoming") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  if (status === "completed") return "border-slate-700 bg-slate-900 text-slate-300";
  return "border-slate-700 bg-slate-900 text-slate-400";
}

export default async function OrganizerTournamentStructurePage({
  params,
}: OrganizerTournamentStructurePageProps) {
  const { id } = await params;
  const data = await getOrganizerTournamentStructure(id);

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Tournament not found.</p>
        <Link
          href="/organizer/tournaments"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          ← Back to tournaments
        </Link>
      </div>
    );
  }

  const approvedTeamsCount = data.approvedTeams.length;
  const hasEnoughTeams = approvedTeamsCount >= 2;
  const hasStageOneMatches = data.matchCount > 0;
  const recommendedHref = !hasEnoughTeams
    ? `/organizer/t/${data.tournamentId}/teams`
    : `/organizer/t/${data.tournamentId}/matches`;
  const recommendedLabel = !hasEnoughTeams
    ? "Go to teams and approve participants"
    : !hasStageOneMatches
      ? "Create first-stage matches"
      : "Continue results and generate knockout";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold text-slate-50">
              Tournament Setup
            </h1>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge(data.status)}`}>
              {data.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Simple setup guide for league/group stage and knockout stage.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tournament:{" "}
            <span className="font-medium text-slate-300">{data.tournamentName}</span>
            {data.sport ? (
              <>
                {" "}
                · <span className="text-slate-400">{data.sport}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/organizer/t/${data.tournamentId}/teams`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Teams
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}/matches`}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Matches & fixtures
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-emerald-700/30 bg-emerald-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
          Recommended next action
        </p>
        <p className="mt-2 text-sm font-medium text-emerald-100">
          {!hasEnoughTeams
            ? "You need at least 2 approved teams before creating matches."
            : !hasStageOneMatches
              ? "Teams are ready. Create stage-1 fixtures now."
              : "Stage-1 fixtures already exist. Continue results and knockout flow in Matches."}
        </p>
        <div className="mt-3">
          <Link
            href={recommendedHref}
            className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            {recommendedLabel}
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Easy flow (3 steps)</h2>
        <p className="mt-1 text-xs text-slate-500">Most organizers only need these three actions.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Link
            href={`/organizer/t/${data.tournamentId}/teams`}
            className={`rounded-lg border px-3 py-3 text-sm ${
              hasEnoughTeams
                ? "border-emerald-700 bg-emerald-950/20 text-emerald-200"
                : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <div className="font-semibold">1) Add / approve teams</div>
            <div className="mt-1 text-xs text-slate-400">
              {approvedTeamsCount} approved
              {hasEnoughTeams ? " · Ready" : " · Need at least 2"}
            </div>
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}/matches`}
            className={`rounded-lg border px-3 py-3 text-sm ${
              hasStageOneMatches
                ? "border-emerald-700 bg-emerald-950/20 text-emerald-200"
                : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <div className="font-semibold">2) Generate stage-1 matches</div>
            <div className="mt-1 text-xs text-slate-400">
              {data.matchCount} created
              {hasStageOneMatches ? " · In progress" : " · Not created"}
            </div>
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}/matches`}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200 hover:bg-slate-800"
          >
            <div className="font-semibold">3) Generate knockout (QF/SF/Final)</div>
            <div className="mt-1 text-xs text-slate-400">Use the matches page knockout tools.</div>
          </Link>
        </div>
      </section>

      {data.suggestions.length > 0 && (
        <section className="rounded-xl border border-amber-800 bg-amber-950/20 p-4">
          <h2 className="text-sm font-semibold text-amber-200">Recommendations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {data.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-100">
          Advanced options (optional)
        </summary>
        <p className="mt-2 text-xs text-slate-500">
          Use this only for manual fixture entry or technical format checks.
        </p>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                {data.categoryCount} categories
              </span>
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                {data.formatRulesCount} format rows
              </span>
              <span
                className={`inline-flex rounded-full border px-3 py-1 font-semibold ${
                  data.hasTournamentRuleConfig
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-slate-950 text-slate-500"
                }`}
              >
                Rule config {data.hasTournamentRuleConfig ? "available" : "missing"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Manual fixture tool</h3>
            <p className="mt-1 text-xs text-slate-500">Only use when auto flow is not suitable.</p>
            <div className="mt-3">
              <ManualFixtureCreateCard
                tournamentId={data.tournamentId}
                teams={data.approvedTeams}
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

