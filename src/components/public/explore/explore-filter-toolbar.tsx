"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ExploreSort,
  ExploreStatusFilter,
  ExploreView,
} from "@/src/features/tournaments/queries/explore-public-tournaments";

function buildUpdatedSearchParams(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>
) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
  }
  // Always reset pagination when filters change.
  next.set("page", "1");
  return next.toString();
}

function normalizeString(v: string | null | undefined) {
  const s = (v ?? "").toString().trim();
  return s;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function ExploreFilterToolbar({
  initial,
}: {
  initial: {
    q?: string;
    status?: ExploreStatusFilter;
    sport?: string;
    location?: string;
    organizer?: string;
    sort?: ExploreSort;
    view?: ExploreView;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initial.q ?? "");
  const [status, setStatus] = useState<ExploreStatusFilter>(
    initial.status ?? "all"
  );
  const [sport, setSport] = useState(initial.sport ?? "all");
  const [location, setLocation] = useState(initial.location ?? "");
  const [organizer, setOrganizer] = useState(initial.organizer ?? "");
  const [sort, setSort] = useState<ExploreSort>(initial.sort ?? "relevant");
  const [view, setView] = useState<ExploreView>(initial.view ?? "grid");

  const debouncedQ = useDebouncedValue(q, 400);
  const debouncedLocation = useDebouncedValue(location, 500);
  const debouncedOrganizer = useDebouncedValue(organizer, 500);

  const sportOptions = useMemo(
    () => ["all", "Football", "Futsal", "Volleyball", "Basketball"],
    []
  );

  // Keep URL in sync (debounced for text fields).
  useEffect(() => {
    const updated = buildUpdatedSearchParams(searchParams, {
      q: normalizeString(debouncedQ) ? debouncedQ : null,
      status,
      sport,
      location: normalizeString(debouncedLocation) ? debouncedLocation : null,
      organizer: normalizeString(debouncedOrganizer) ? organizer : null,
      sort,
      view,
    });
    router.replace(`${pathname}?${updated}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, debouncedLocation, debouncedOrganizer, status, sport, sort, view]);

  const clearAll = () => {
    const next = buildUpdatedSearchParams(searchParams, {
      q: null,
      status: "all",
      sport: "all",
      location: null,
      organizer: null,
      sort: "relevant",
      view: view ?? "grid",
    });
    router.replace(`${pathname}?${next}`);
  };

  return (
    <div className="sticky top-14 z-40">
      <section className="mx-auto max-w-7xl px-4 py-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-300">
                Search
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
                <svg
                  className="h-5 w-5 text-emerald-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search tournament name, organizer, or location"
                  className="w-full bg-transparent text-sm text-slate-50 placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:max-w-3xl">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as ExploreStatusFilter)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  <option value="all">All</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="live">Live</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Sport
                </label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
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
                  Location
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Malé"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-400/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Organizer
                </label>
                <input
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="e.g. GameOn League"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-400/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Sort
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as ExploreSort)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  <option value="relevant">Most Relevant</option>
                  <option value="newest">Newest</option>
                  <option value="startingSoon">Starting Soon</option>
                  <option value="updated">Recently Updated</option>
                  <option value="popular">Most Popular (later)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  View
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors ${
                      view === "grid"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-slate-950/30 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors ${
                      view === "list"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-slate-950/30 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={clearAll}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

