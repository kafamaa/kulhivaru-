"use client";

import { useMemo, useState } from "react";

import type { PublicPlayerRecentMatch } from "@/src/features/players/queries/get-public-player-recent-matches";
import { MatchRow } from "@/src/components/public/player-detail/match-row";

type ContributionFilter = "all" | "goals" | "assists";

function FilterBar({
  filter,
  onChange,
}: {
  filter: ContributionFilter;
  onChange: (f: ContributionFilter) => void;
}) {
  const options: Array<{ id: ContributionFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "goals", label: "Goals" },
    { id: "assists", label: "Assists" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
            filter === opt.id
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function PlayerMatchesPanel({
  matches,
}: {
  matches: PublicPlayerRecentMatch[];
}) {
  const [filter, setFilter] = useState<ContributionFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    if (filter === "goals") return matches.filter((m) => m.contributions.goals > 0);
    return matches.filter((m) => m.contributions.assists > 0);
  }, [filter, matches]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Matches</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filter by goals or assists.
          </p>
        </div>
        <FilterBar filter={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          {matches.length === 0 ? "No matches played yet" : "No matches match this filter"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <MatchRow key={m.matchId} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

