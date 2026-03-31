import Link from "next/link";

import type { PublicPlayerRecentMatch } from "@/src/features/players/queries/get-public-player-recent-matches";

function resultBadge(resultBadge: PublicPlayerRecentMatch["resultBadge"]) {
  if (resultBadge === "W") return { label: "Win", className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" };
  if (resultBadge === "D") return { label: "Draw", className: "border-white/10 bg-white/5 text-slate-200" };
  if (resultBadge === "L") return { label: "Loss", className: "border-red-400/25 bg-red-500/10 text-red-100" };
  return null;
}

function contributionIcons(c: PublicPlayerRecentMatch["contributions"]) {
  const parts: Array<{ key: string; text: string; count: number; color: string }> = [
    { key: "g", text: "⚽", count: c.goals, color: "text-emerald-200" },
    { key: "a", text: "🅰", count: c.assists, color: "text-sky-200" },
    { key: "yc", text: "🟨", count: c.yellowCards, color: "text-amber-200" },
    { key: "rc", text: "🟥", count: c.redCards, color: "text-red-100" },
  ];

  return parts.filter((p) => p.count > 0).map((p) => (
    <span
      key={p.key}
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold ${p.color}`}
      aria-label={`${p.text} ${p.count}`}
    >
      <span>{p.text}</span>
      <span className="tabular-nums">{p.count}</span>
    </span>
  ));
}

export function MatchRow({
  match,
}: {
  match: PublicPlayerRecentMatch;
}) {
  const badge = resultBadge(match.resultBadge);

  const statusLabel = match.status;
  const scoreLabel = match.scoreText ?? (match.status === "ft" ? "0 - 0" : "—");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-50">
            vs {match.opponentTeamName}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {match.roundLabel ? `${match.roundLabel} · ` : ""}
            {match.tournamentName}
          </div>
        </div>

        <div className="flex flex-col gap-1 sm:items-end">
          <div className="text-base font-bold text-slate-50 tabular-nums">
            {scoreLabel}
          </div>
          <div className="flex items-center gap-2">
            {badge ? (
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${badge.className}`}>
                {badge.label}
              </span>
            ) : null}
            <span className="text-[11px] font-semibold text-slate-400">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {contributionIcons(match.contributions)}
          {match.contributions.goals === 0 &&
          match.contributions.assists === 0 &&
          match.contributions.yellowCards === 0 &&
          match.contributions.redCards === 0 ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
              No recorded contributions
            </span>
          ) : null}
        </div>
        <div>
          <Link
            href={`/match/${match.matchId}`}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/25 hover:text-emerald-200"
          >
            Open Match →
          </Link>
        </div>
      </div>
    </div>
  );
}

