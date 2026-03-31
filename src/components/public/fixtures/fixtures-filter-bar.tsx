"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  FixturesPageGroupOption,
  FixturesPagePhaseOption,
} from "@/src/features/matches/queries/list-public-tournament-fixtures";

type DateMode = "all" | "today" | "tomorrow" | "yesterday" | "custom";

function guessDateMode(date?: string): { mode: DateMode; customValue: string | null } {
  if (!date) return { mode: "all", customValue: null };
  const d = date.trim().toLowerCase();
  if (d === "today" || d === "tomorrow" || d === "yesterday") {
    return { mode: d as DateMode, customValue: null };
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return { mode: "custom", customValue: d };
  }
  return { mode: "today", customValue: null };
}

export function FixturesFilterBar({
  activeTab,
  slug,
  phases,
  groups,
  initial,
}: {
  activeTab: Exclude<import("@/src/features/matches/queries/list-public-tournament-fixtures").TournamentFixturesTab, "auto">;
  slug: string;
  phases: FixturesPagePhaseOption[];
  groups: FixturesPageGroupOption[];
  initial: {
    phaseKey?: string;
    groupKey?: string;
    date?: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phaseKey, setPhaseKey] = useState(initial.phaseKey ?? "all");
  const [groupKey, setGroupKey] = useState(initial.groupKey ?? "all");

  const { mode: initialMode, customValue: initialCustom } = guessDateMode(initial.date);
  const [dateMode, setDateMode] = useState<DateMode>(initialMode);
  const [customDate, setCustomDate] = useState(initialCustom ?? "");

  const apply = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  const clearFilters = () => {
    apply({
      phase: null,
      group: null,
      date: null,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="sticky top-[12.2rem] z-20 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-50">Filters</div>
              <div className="mt-1 text-xs text-slate-400">
                Refine fixtures by phase, group, and date (URL-synced).
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[720px] lg:grid-cols-3">
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
                  {phases.map((p) => (
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
                    apply({ group: v === "all" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {groups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Date</label>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={dateMode}
                    onChange={(e) => {
                      const v = e.target.value as DateMode;
                      setDateMode(v);
                      if (v === "all") {
                        apply({ date: null });
                      } else if (v !== "custom") {
                        apply({ date: v });
                      }
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                  >
                    <option value="all">Any time</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="custom">Specific date</option>
                  </select>
                </div>

                {dateMode === "custom" ? (
                  <div className="mt-2">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomDate(v);
                      }}
                      onBlur={() => {
                        apply({ date: customDate || null });
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                      aria-label="Specific date"
                    />
                    <div className="mt-1 text-[11px] text-slate-400">
                      Updates on blur.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

