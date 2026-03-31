"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  TournamentStatsGroupOption,
  TournamentStatsPhaseOption,
} from "@/src/features/tournaments/queries/get-public-tournament-stats";

export function TournamentStatsFilterBar({
  slug,
  initial,
  phaseOptions,
  groupOptions,
}: {
  slug: string;
  initial: { phaseKey?: string | null; groupKey?: string | null; category?: string | null };
  phaseOptions: TournamentStatsPhaseOption[];
  groupOptions: TournamentStatsGroupOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phaseKey, setPhaseKey] = useState(initial.phaseKey ?? "all");
  const [groupKey, setGroupKey] = useState(initial.groupKey ?? "overall");

  const apply = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === "all" || v === "overall") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="sticky top-[12.2rem] z-20 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-50">Filters</div>
              <div className="mt-1 text-xs text-slate-400">
                Phase + group scope (URL-synced). Category is MVP-disabled.
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[720px] lg:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Category</label>
                <select
                  value="all"
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-400 outline-none"
                >
                  <option value="all">All categories (MVP)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Phase</label>
                <select
                  value={phaseKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPhaseKey(v);
                    apply({ phase: v === "all" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {phaseOptions.map((p) => (
                    <option key={p.key} value={p.key === "all" ? "all" : p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Group</label>
                <select
                  value={groupKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGroupKey(v);
                    apply({ group: v === "overall" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {groupOptions.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => apply({ phase: null, group: null, category: null })}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

