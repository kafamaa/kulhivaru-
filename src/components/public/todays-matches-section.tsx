"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PublicMatchPreview } from "@/src/features/matches/types";

type Tab = "all" | "live" | "results" | "upcoming";

interface TodaysMatchesSectionProps {
  matches: PublicMatchPreview[];
  isLoading?: boolean;
}

export function TodaysMatchesSection({
  matches,
  isLoading = false,
}: TodaysMatchesSectionProps) {
  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const [tab, setTab] = useState<Tab>("all");

  const filtered =
    tab === "all"
      ? matches
      : tab === "live"
        ? matches.filter((m) => m.statusLabel.toLowerCase().includes("live"))
        : tab === "results"
          ? matches.filter((m) => m.score && (m.statusLabel.toLowerCase().includes("ft") || m.statusLabel.toLowerCase().includes("result")))
          : matches.filter((m) => !m.statusLabel.toLowerCase().includes("live") && !m.statusLabel.toLowerCase().includes("ft"));

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "live", label: "Live" },
    { id: "results", label: "Results" },
    { id: "upcoming", label: "Upcoming" },
  ];

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="mb-3 h-6 w-32 animate-pulse rounded bg-slate-900/70" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl bg-slate-900/70"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
        <h2 className="mb-3 text-lg font-semibold text-slate-50">
          Today&apos;s matches
        </h2>
        <div className="mb-4 flex gap-1 rounded-xl bg-slate-900/40 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white/10 text-slate-50 ring-1 ring-white/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 py-10 text-center text-sm text-slate-400">
            No matches in this category right now.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.slice(0, 8).map((m) => (
              <li key={m.id}>
                <Link
                  href={`/t/${m.tournamentSlug}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm transition-colors hover:border-emerald-400/30 hover:bg-slate-950/60"
                >
                  <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                    <span className="flex min-w-0 items-center gap-2 truncate text-slate-100">
                      <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[9px] font-bold text-slate-200">
                        {m.homeTeamLogoUrl ? (
                          <Image src={m.homeTeamLogoUrl} alt={m.homeTeam} fill className="object-cover" />
                        ) : (
                          initials(m.homeTeam)
                        )}
                      </span>
                      <span className="truncate">{m.homeTeam}</span>
                    </span>
                    <span className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-50">
                      {m.score ?? "–"}
                    </span>
                    <span className="flex min-w-0 items-center justify-end gap-2 truncate text-right text-slate-100">
                      <span className="truncate">{m.awayTeam}</span>
                      <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[9px] font-bold text-slate-200">
                        {m.awayTeamLogoUrl ? (
                          <Image src={m.awayTeamLogoUrl} alt={m.awayTeam} fill className="object-cover" />
                        ) : (
                          initials(m.awayTeam)
                        )}
                      </span>
                    </span>
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-slate-400">
                    {m.statusLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {matches.length > 0 && (
          <div className="mt-3 text-center">
            <Link
              href="/matches"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              View all matches
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
