"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  WatchMediaType,
  WatchTournamentOption,
} from "@/src/features/media/queries/list-public-watch-media";

export function MediaFilterToolbar({
  initial,
  tournamentOptions,
  resultsCountLabel,
}: {
  initial: {
    type: WatchMediaType;
    tournamentSlug?: string | null;
    date?: string | null;
  };
  tournamentOptions: WatchTournamentOption[];
  resultsCountLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [type, setType] = useState<WatchMediaType>(initial.type);
  const [tournamentSlug, setTournamentSlug] = useState<string>(
    initial.tournamentSlug ?? "all"
  );
  const [date, setDate] = useState<string>(initial.date ?? "");

  useEffect(() => {
    setType(initial.type);
    setTournamentSlug(initial.tournamentSlug ?? "all");
    setDate(initial.date ?? "");
  }, [initial.type, initial.tournamentSlug, initial.date]);

  const sportOptions = useMemo(() => [], []);

  const apply = (updates: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === "" || v === "all") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <section className="sticky top-14 z-40">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Media Filters
                  </h2>
                  {resultsCountLabel ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {resultsCountLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "live", label: "Live" },
                    { id: "highlight", label: "Highlights" },
                    { id: "replay", label: "Replays" },
                  ] as Array<{ id: WatchMediaType; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setType(opt.id);
                      apply({ type: opt.id === "all" ? null : opt.id });
                    }}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      type === opt.id
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[520px] lg:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Tournament
                </label>
                <select
                  value={tournamentSlug}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTournamentSlug(v);
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
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Date (optional)
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    apply({ date: e.target.value || null });
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setType("all");
                    setTournamentSlug("all");
                    setDate("");
                    apply({ type: null, tournament: null, date: null });
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

