import Image from "next/image";
import Link from "next/link";
import type { PublicMatchCenterItem } from "@/src/features/matches/queries/list-public-matches-center";

function ScoreBlock({ scoreText }: { scoreText: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
      <div className="text-xs font-medium text-slate-400">Score</div>
      <div className="mt-1 text-lg font-bold text-slate-50 tabular-nums">
        {scoreText ?? "—"}
      </div>
    </div>
  );
}

function TeamBlock({
  team,
  label,
}: {
  team: PublicMatchCenterItem["home"];
  label: string;
}) {
  if (!team) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
          —
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-50">TBA</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-cover"
          />
        ) : (
          <div className="text-sm font-bold text-slate-400">
            {team.teamName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-50">
          {team.teamName}
        </div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function MatchCard({
  match,
  variant,
}: {
  match: PublicMatchCenterItem;
  variant: "live" | "scheduled" | "completed" | "upcoming";
}) {
  const isLive = variant === "live";

  const accent = isLive
    ? "border-red-400/30 bg-red-500/5 shadow-[0_18px_70px_rgba(239,68,68,0.10)]"
    : "border-white/10 bg-white/5";

  const watchHref = "/watch";

  return (
    <article
      className={`rounded-3xl border p-4 backdrop-blur-md ${accent}`}
      aria-label={`Match ${match.home?.teamName ?? ""} vs ${match.away?.teamName ?? ""}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {match.tournamentName}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-200">
                {match.tournamentSport}
              </span>
              {match.location ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-200">
                  {match.location}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${
                isLive
                  ? "border-red-400/30 bg-red-400/10 text-red-100"
                  : variant === "completed"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
              }`}
            >
              {match.statusLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <TeamBlock team={match.home} label="Home" />
          <ScoreBlock scoreText={match.scoreText} />
          <TeamBlock team={match.away} label="Away" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {match.scheduledAt ? (
              <span>
                Starts at{" "}
                <span className="font-semibold text-slate-300 tabular-nums">
                  {new Date(match.scheduledAt).toISOString().slice(11, 16)} UTC
                </span>
              </span>
            ) : (
              <span>Time TBD</span>
            )}
            {match.roundLabel ? ` · ${match.roundLabel}` : ""}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/match/${match.id}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              View Match
            </Link>
            {isLive ? (
              <Link
                href={watchHref}
                className="inline-flex items-center rounded-2xl bg-red-500/15 border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/25"
              >
                Watch →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

