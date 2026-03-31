"use client";

import Link from "next/link";

import type { TournamentOverviewSectionId } from "./tournament-overview-types";

const NAV: Array<{ id: TournamentOverviewSectionId; label: string; href: (slug: string) => string }> = [
  { id: "overview", label: "Overview", href: (slug) => `/t/${slug}` },
  { id: "fixtures", label: "Fixtures", href: (slug) => `/t/${slug}/fixtures` },
  { id: "standings", label: "Standings", href: (slug) => `/t/${slug}/standings` },
  { id: "stats", label: "Stats", href: (slug) => `/t/${slug}/stats` },
  { id: "teams", label: "Teams", href: (slug) => `/t/${slug}/teams` },
  { id: "media", label: "Media", href: (slug) => `/t/${slug}/media` },
];

export function TournamentSubNav({
  slug,
  active,
}: {
  slug: string;
  active: TournamentOverviewSectionId;
}) {
  return (
    <div className="sticky top-14 z-30">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-3 rounded-3xl border border-white/15 bg-white/[0.07] p-2.5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.3)]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {NAV.map((item) => {
              const href = item.href(slug);
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`flex-shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.22)]"
                      : "border-white/15 bg-white/[0.05] text-slate-300 hover:-translate-y-0.5 hover:bg-white/[0.1]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

