"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  TournamentMediaSort,
  TournamentMediaTypeFilter,
} from "@/src/features/tournaments/queries/list-public-tournament-media";

type Option<T extends string> = { id: T; label: string };

const TYPE_OPTIONS: Option<TournamentMediaTypeFilter>[] = [
  { id: "all", label: "All" },
  { id: "videos", label: "Videos" },
  { id: "live", label: "Live" },
  { id: "highlights", label: "Highlights" },
  { id: "replays", label: "Replays" },
  { id: "photos", label: "Photos (MVP)" },
];

const SORT_OPTIONS: Option<TournamentMediaSort>[] = [
  { id: "featured", label: "Featured" },
  { id: "latest", label: "Latest" },
  { id: "oldest", label: "Oldest" },
];

export function TournamentMediaFilterBar({
  initialType,
  initialSort,
}: {
  initialType: TournamentMediaTypeFilter;
  initialSort: TournamentMediaSort;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [type, setType] = useState<TournamentMediaTypeFilter>(initialType);
  const [sort, setSort] = useState<TournamentMediaSort>(initialSort);

  const activeChips = useMemo(() => {
    const chips: string[] = [];
    if (type !== "all") chips.push(`Type: ${type}`);
    if (sort !== "featured") chips.push(`Sort: ${sort}`);
    return chips;
  }, [type, sort]);

  const apply = (updates: Partial<{ type: TournamentMediaTypeFilter; sort: TournamentMediaSort }>) => {
    const next = new URLSearchParams(searchParams.toString());
    if (updates.type) {
      if (updates.type === "all") next.delete("type");
      else next.set("type", updates.type);
    }
    if (updates.sort) {
      if (updates.sort === "featured") next.delete("sort");
      else next.set("sort", updates.sort);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  const clear = () => {
    apply({ type: "all", sort: "featured" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="sticky top-[12.2rem] z-20 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-50">Filters</div>
              <div className="mt-1 text-xs text-slate-400">
                Browse by media type and ordering.
              </div>

              {activeChips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {activeChips.map((c) => (
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
                  <option value="all">All Categories (MVP)</option>
                </select>
                <div className="mt-1 text-[11px] text-amber-200">
                  Category tagging not exposed for media yet.
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Media type
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    const v = e.target.value as TournamentMediaTypeFilter;
                    setType(v);
                    apply({ type: v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Sort
                </label>
                <select
                  value={sort}
                  onChange={(e) => {
                    const v = e.target.value as TournamentMediaSort;
                    setSort(v);
                    apply({ sort: v });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

