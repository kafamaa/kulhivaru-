"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  TournamentTeamsGroupOption,
} from "@/src/features/teams/queries/get-public-tournament-teams-directory";
import type {
  TournamentTeamsSort,
  TournamentTeamsStatusFilter,
} from "@/src/features/teams/queries/get-public-tournament-teams-directory";

const STATUS_TABS: Array<{ id: TournamentTeamsStatusFilter; label: string }> = [
  { id: "all", label: "All Teams" },
  { id: "leading", label: "Leading" },
  { id: "qualified", label: "Qualified" },
  { id: "active", label: "Active" },
  { id: "eliminated", label: "Eliminated" },
];

const SORTS: Array<{ id: TournamentTeamsSort; label: string }> = [
  { id: "rank", label: "Rank" },
  { id: "points", label: "Most Points" },
  { id: "played", label: "Most Played" },
];

export function TeamsFilterBar({
  slug,
  groups,
  initial,
}: {
  slug: string;
  groups: TournamentTeamsGroupOption[];
  initial: {
    q?: string | null;
    groupKey?: string | null;
    status: TournamentTeamsStatusFilter;
    sort: TournamentTeamsSort;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initial.q ?? "");
  const [groupKey, setGroupKey] = useState(initial.groupKey ?? "overall");
  const [status, setStatus] = useState<TournamentTeamsStatusFilter>(initial.status);
  const [sort, setSort] = useState<TournamentTeamsSort>(initial.sort);

  const chips = useMemo(() => {
    const out: string[] = [];
    if (initial.q) out.push(`Search: ${initial.q}`);
    if (initial.groupKey && initial.groupKey !== "overall") out.push(`Group: ${groups.find((g) => g.key === initial.groupKey)?.label ?? initial.groupKey}`);
    if (initial.status !== "all") out.push(`Status: ${initial.status}`);
    if (initial.sort !== "rank") out.push(`Sort: ${initial.sort}`);
    return out;
  }, [groups, initial.groupKey, initial.q, initial.sort, initial.status]);

  const apply = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === "" || v === "all" || v === "overall") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  const clear = () => {
    apply({
      q: null,
      group: null,
      status: null,
      sort: null,
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="sticky top-[12.2rem] z-20 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-50">Filters</div>
              <div className="mt-1 text-xs text-slate-400">
                Search, group, status and sort (URL-synced).
              </div>
              {chips.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {chips.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
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

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-medium text-slate-300">Search</label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => apply({ q: query.trim() ? query.trim() : null })}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                  placeholder="Team name"
                  aria-label="Search teams"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Group</label>
                <select
                  value={groupKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGroupKey(v);
                    apply({ group: v });
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
                <label className="text-xs font-medium text-slate-300">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const v = e.target.value as TournamentTeamsStatusFilter;
                    setStatus(v);
                    apply({ status: v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {STATUS_TABS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    const v = e.target.value as TournamentTeamsSort;
                    setSort(v);
                    apply({ sort: v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                Clear filters
              </button>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-amber-200">
            Category filter is disabled in MVP (no category assignment on tournament teams yet).
          </p>
        </div>
      </div>
    </section>
  );
}

