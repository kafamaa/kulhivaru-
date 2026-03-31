"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PublicTournamentOption } from "@/src/features/stats/queries/list-public-tournament-options";
import type { StatsHubTab } from "./stats-tabs";

export function StatsFilterToolbar({
  activeTab,
  tournamentOptions,
  initial,
}: {
  activeTab: StatsHubTab;
  tournamentOptions: PublicTournamentOption[];
  initial: {
    tournament?: string;
    category?: string;
    scope?: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tournament, setTournament] = useState(initial.tournament ?? "all");
  const [category, setCategory] = useState(initial.category ?? "all");
  const [scope, setScope] = useState(initial.scope ?? "overall");

  useEffect(() => {
    setTournament(initial.tournament ?? "all");
    setCategory(initial.category ?? "all");
    setScope(initial.scope ?? "overall");
  }, [initial.category, initial.scope, initial.tournament]);

  const apply = (updates: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "" || value === "all") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  const isTournamentEffective =
    activeTab === "team-rankings" ||
    activeTab === "assists" ||
    activeTab === "cards" ||
    activeTab === "clean-sheets";

  const categoryOptions = useMemo(() => {
    return [{ id: "all", label: "All categories" }];
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="sticky top-[7.6rem] z-20 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-50">
                Filters
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Tournament and category scope (URL-synced).
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[640px] lg:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Tournament
                </label>
                <select
                  value={tournament}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTournament(v);
                    apply({ tournament: v === "all" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  <option value="all">All tournaments</option>
                  {tournamentOptions.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {!isTournamentEffective && tournament !== "all" ? (
                  <p className="mt-1 text-[11px] text-amber-200">
                    Tournament filter applies to team rankings in this MVP.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCategory(v);
                    apply({ category: v === "all" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Stat scope
                </label>
                <select
                  value={scope}
                  onChange={(e) => {
                    const v = e.target.value;
                    setScope(v);
                    apply({ scope: v === "overall" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  <option value="overall">Overall</option>
                  <option value="per-tournament">Per Tournament</option>
                  <option value="per-category">Per Category</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

