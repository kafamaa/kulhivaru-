"use client";

import type { ReactNode } from "react";

export type GlassTabId = string;

export function GlassTabs<T extends GlassTabId>({
  tabs,
  activeTab,
  onTabChange,
  rightSlot,
}: {
  tabs: Array<{ id: T; label: string }>;
  activeTab: T;
  onTabChange: (tab: T) => void;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="sticky top-14 z-30 mt-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange(t.id)}
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
            {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

