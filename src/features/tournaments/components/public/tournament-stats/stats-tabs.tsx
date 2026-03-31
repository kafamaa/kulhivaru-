"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { TournamentStatsTab } from "@/src/features/tournaments/queries/get-public-tournament-stats";

const TABS: Array<{ id: TournamentStatsTab; label: string }> = [
  { id: "top-scorers", label: "Top Scorers" },
  { id: "assists", label: "Assists" },
  { id: "clean-sheets", label: "Clean Sheets" },
  { id: "cards", label: "Cards" },
  { id: "team-stats", label: "Team Stats" },
];

export function TournamentStatsTabs({ activeTab }: { activeTab: TournamentStatsTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qs = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const onTab = (tab: TournamentStatsTab) => {
    const next = new URLSearchParams(qs.toString());
    next.set("tab", tab);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="sticky top-[7.6rem] z-20 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTab(t.id)}
                  className={`flex-shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

