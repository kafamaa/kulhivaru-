"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TournamentStandingsPhaseKey } from "@/src/features/standings/queries/get-public-tournament-standings";

export function StandingsSelectors({
  initial,
  phaseOptions,
  groupOptions,
}: {
  initial: { phase: TournamentStandingsPhaseKey; groupKey: string };
  phaseOptions: Array<{ key: TournamentStandingsPhaseKey; label: string }>;
  groupOptions: Array<{ key: string; label: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<TournamentStandingsPhaseKey>(initial.phase);
  const [groupKey, setGroupKey] = useState<string>(initial.groupKey);
  const categoryOptions = useMemo(() => [{ key: "all", label: "All categories (MVP)" }], []);

  const apply = (updates: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v || v === "all") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-50">Scope</h3>
            <p className="mt-1 text-xs text-slate-400">
              Switch group/phase to view the official ranking table.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[720px] lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Category</label>
              <select
                value={"all"}
                disabled
                className="mt-2 w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-400 outline-none"
              >
                {categoryOptions.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Phase</label>
              <select
                value={phase}
                onChange={(e) => {
                  const v = e.target.value as TournamentStandingsPhaseKey;
                  setPhase(v);
                  apply({ phase: v === "group-stage" ? null : v });
                }}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
              >
                {phaseOptions.map((p) => (
                  <option key={p.key} value={p.key}>
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
      </div>
    </section>
  );
}

