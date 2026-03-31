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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold text-slate-50">
              Structure
            </h1>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge(data.status)}`}>
              {data.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            This page reads live data: categories and format rules from your published wizard payload, sport-level and category rule configs when present, plus approved teams and matches.
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Approved teams
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-50 tabular-nums">
            {data.approvedTeams.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Needed for generating fixtures.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Matches created
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-50 tabular-nums">
            {data.matchCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Generated fixtures live in Matches.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Next step
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-100">
            {data.approvedTeams.length < 2 ? "Approve teams" : data.matchCount === 0 ? "Generate fixtures" : "Schedule matches"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Follow the checklist below.
          </p>
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Categories</h2>
          <p className="mt-2 text-sm text-slate-400">
            Rows in <span className="font-mono text-slate-300">tournament_categories</span> (written when you publish from the wizard).
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {data.categoryCount} categories
            </span>
            <Link
              href={`/organizer/t/${data.tournamentId}/settings`}
              className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
            >
              Edit basics / re-publish
            </Link>
          </div>

          {data.categories.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              No categories in the database yet. Create or re-publish from{" "}
              <Link href="/organizer/tournaments/new" className="text-emerald-400 hover:text-emerald-300">
                the wizard
              </Link>{" "}
              so categories and linked tables are populated.
            </p>
          ) : (
            <div className="mt-4 grid gap-2">
              {data.categories.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100">
                        {c.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {c.shortLabel} · {c.visibility}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      {c.matchDurationMinutes != null
                        ? `${c.matchDurationMinutes} min`
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
              {data.categories.length > 6 ? (
                <div className="text-xs text-slate-500">
                  Showing first 6 categories.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-semibold text-slate-100">
            Format rules
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Rows in <span className="font-mono text-slate-300">tournament_format_rules</span> (one per
            category). Sport/event logic also uses{" "}
            <span className="font-mono text-slate-300">tournament_rule_configs</span>,{" "}
            <span className="font-mono text-slate-300">category_rule_configs</span>, and optional{" "}
            <span className="font-mono text-slate-300">phase_rule_configs</span>.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {data.formatRulesCount} format rows
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                data.hasTournamentRuleConfig
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-500"
              }`}
            >
              Tournament rules {data.hasTournamentRuleConfig ? "on file" : "—"}
            </span>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {data.categoryRuleConfigCount} category rule configs
            </span>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {data.phaseRuleConfigCount} phase overrides
            </span>
          </div>

          {data.formatRules.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">
              No format rule rows for this tournament. They are created when categories are published from
              the wizard.
            </p>
          ) : (
            <div className="mt-4 grid gap-2">
              {data.formatRules.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-300"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-100">
                      {r.categoryName}{" "}
                      <span className="font-normal text-slate-500">({r.categoryShortLabel})</span>
                    </span>
                    <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] uppercase text-slate-400">
                      {r.formatType}
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Groups / advance / runners-up</dt>
                      <dd className="tabular-nums text-slate-200">
                        {r.groupCount} groups · top {r.teamsAdvancePerGroup} · best RU{" "}
                        {r.includeBestRunnersUp}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Knockout / legs / 3rd place</dt>
                      <dd className="text-slate-200">
                        {r.knockoutRound ?? "—"} · {r.roundRobinLegs} leg(s)
                        {r.thirdPlaceMatch ? " · 3rd place" : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Match / break (format row)</dt>
                      <dd className="tabular-nums text-slate-200">
                        {r.matchDurationMinutes} min match · {r.breakDurationMinutes} min break
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Scheduling density</dt>
                      <dd className="tabular-nums text-slate-200">
                        ≤{r.maxMatchesPerDayPerTeam}/team/day · {r.minRestMinutesBetweenMatches} min rest
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Auto-generate fixtures (flag)</dt>
                      <dd className="text-slate-200">{r.autoGenerateFixtures ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Generating or editing fixtures still happens under{" "}
            <Link
              href={`/organizer/t/${data.tournamentId}/matches`}
              className="text-emerald-400 hover:text-emerald-300"
            >
              Matches
            </Link>
            ; these rows define saved structure and constraints from publish.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Approved teams</h2>
        {data.approvedTeams.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No approved teams yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.approvedTeams.slice(0, 20).map((t) => (
              <span key={t.id} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <ManualFixtureCreateCard
        tournamentId={data.tournamentId}
        teams={data.approvedTeams}
      />
    </div>
  );
}

