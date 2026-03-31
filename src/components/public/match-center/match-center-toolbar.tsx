"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  MatchCenterStatusFilter,
  MatchCenterTab,
  MatchCenterView,
} from "@/src/features/matches/queries/list-public-matches-center";
import type { MatchCenterTournamentOption } from "@/src/features/matches/queries/list-public-matches-center";

function buildQuery(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>
) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
  }
  next.set("page", "1");
  return next.toString();
}

function normalizeTabDefaultStatus(tab: MatchCenterTab): MatchCenterStatusFilter {
  if (tab === "live") return "live";
  if (tab === "results") return "completed";
  if (tab === "upcoming") return "scheduled";
  return "all";
}

export function MatchCenterToolbar({
  initial,
  tournamentOptions,
  defaultView,
  initialShowCount,
}: {
  initial: {
    tab: MatchCenterTab;
    date: string;
    tournament?: string;
    sport?: string;
    status?: MatchCenterStatusFilter;
    view?: MatchCenterView;
  };
  tournamentOptions: MatchCenterTournamentOption[];
  defaultView?: MatchCenterView;
  initialShowCount?: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const todayUtc = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const [tab, setTab] = useState<MatchCenterTab>(initial.tab);
  const [date, setDate] = useState<string>(initial.date ?? "today");
  const [tournament, setTournament] = useState<string>(initial.tournament ?? "");
  const [sport, setSport] = useState<string>(initial.sport ?? "all");
  const [status, setStatus] = useState<MatchCenterStatusFilter>(
    initial.status ?? normalizeTabDefaultStatus(initial.tab)
  );
  const [view, setView] = useState<MatchCenterView>(
    initial.view ?? defaultView ?? "grid"
  );

  useEffect(() => {
    setStatus((prev) => prev ?? normalizeTabDefaultStatus(tab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const sportOptions = useMemo(
    () => ["all", "Football", "Futsal", "Volleyball", "Basketball"],
    []
  );

  const onTabChange = (nextTab: MatchCenterTab) => {
    setTab(nextTab);
    setStatus(normalizeTabDefaultStatus(nextTab));
    const q = buildQuery(searchParams, {
      tab: nextTab,
      status: normalizeTabDefaultStatus(nextTab),
      date,
      tournament: tournament || null,
      sport: sport || "all",
      view,
    });
    router.replace(`${pathname}?${q}`);
  };

  const onClear = () => {
    setTab("today");
    setDate("today");
    setTournament("");
    setSport("all");
    setStatus("all");
    setView("grid");
    const q = buildQuery(searchParams, {
      tab: "today",
      date: "today",
      tournament: null,
      sport: null,
      status: null,
      view: "grid",
    });
    router.replace(`${pathname}?${q}`);
  };

  const onApplyFilters = (updates: Record<string, string | null | undefined>) => {
    const q = buildQuery(searchParams, updates);
    router.replace(`${pathname}?${q}`);
  };

  const isPresetDate = date === "today" || date === "tomorrow" || date === "yesterday";
  const dateMode: "preset" | "custom" = isPresetDate ? "preset" : "custom";

  return (
    <div className="sticky top-14 z-40">
      <section className="mx-auto max-w-7xl px-4 py-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-50">
                  {initialShowCount != null ? (
                    <span>
                      {initialShowCount} matches
                    </span>
                  ) : (
                    "Matches"
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Clear filters
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView("grid");
                      onApplyFilters({ view: "grid" });
                    }}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      view === "grid"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("list");
                      onApplyFilters({ view: "list" });
                    }}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      view === "list"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                { id: "live", label: "Live" },
                { id: "today", label: "Today" },
                { id: "results", label: "Results" },
                { id: "upcoming", label: "Upcoming" },
              ] as Array<{ id: MatchCenterTab; label: string }>).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange(t.id)}
                  className={`flex-shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    tab === t.id
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Date
                </label>
                <div className="mt-2 flex gap-2">
                  <select
                    value={dateMode === "preset" ? date : "custom"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") {
                        const next = date.includes("-") ? date : todayUtc;
                        setDate(next);
                        onApplyFilters({ date: next });
                      } else {
                        setDate(v);
                        onApplyFilters({ date: v });
                      }
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                  >
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {dateMode === "custom" ? (
                  <input
                    type="date"
                    value={date.includes("-") ? date : ""}
                    onChange={(e) => {
                      setDate(e.target.value);
                      onApplyFilters({ date: e.target.value });
                    }}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                  />
                ) : null}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Tournament
                </label>
                <select
                  value={tournament || "all"}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTournament(v === "all" ? "" : v);
                    onApplyFilters({ tournament: v === "all" ? null : v });
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
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Sport
                </label>
                <select
                  value={sport}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSport(v);
                    onApplyFilters({ sport: v === "all" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {sportOptions.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All sports" : s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const v = e.target.value as MatchCenterStatusFilter;
                    setStatus(v);
                    onApplyFilters({ status: v === "all" ? null : v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  <option value="all">All</option>
                  <option value="live">Live</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

