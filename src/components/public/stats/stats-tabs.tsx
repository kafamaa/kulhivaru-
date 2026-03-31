"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export type StatsHubTab =
  | "top-scorers"
  | "assists"
  | "team-rankings"
  | "clean-sheets"
  | "cards";

const TABS: Array<{ id: StatsHubTab; label: string }> = [
  { id: "top-scorers", label: "Top Scorers" },
  { id: "assists", label: "Assists" },
  { id: "team-rankings", label: "Team Rankings" },
  { id: "clean-sheets", label: "Clean Sheets" },
  { id: "cards", label: "Cards" },
];

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (!value || value === "all") params.delete(key);
  else params.set(key, value);
}

export function StatsHubTabs({
  activeTab,
}: {
  activeTab: StatsHubTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onTab = (tab: StatsHubTab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="sticky top-14 z-30 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                className={`flex-shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === t.id
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

