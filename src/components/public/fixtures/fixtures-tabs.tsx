"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TournamentFixturesTab } from "@/src/features/matches/queries/list-public-tournament-fixtures";

const TABS: Array<{ id: Exclude<TournamentFixturesTab, "auto">; label: string }> = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "results", label: "Results" },
  { id: "upcoming", label: "Upcoming" },
];

export function FixturesTabs({
  activeTab,
}: {
  activeTab: Exclude<TournamentFixturesTab, "auto">;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const disabledSet = useMemo(() => new Set<string>(), []);

  const onTab = (tab: Exclude<TournamentFixturesTab, "auto">) => {
    const next = new URLSearchParams(searchParams.toString());
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
              const disabled = disabledSet.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onTab(t.id)}
                  className={`flex-shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  } ${disabled ? "opacity-50" : ""}`}
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

