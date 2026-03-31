"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TournamentOverviewGroupOption } from "@/src/features/tournaments/queries/get-public-tournament-overview-data";

export function TournamentGroupSelector({
  groups,
  selectedGroupId,
}: {
  groups: TournamentOverviewGroupOption[];
  selectedGroupId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = selectedGroupId ?? "overall";

  const groupLabelById = useMemo(() => {
    return new Map(groups.map((g) => [g.groupId ?? "overall", g.label]));
  }, [groups]);

  const apply = (nextGroupValue: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("group", nextGroupValue);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div>
      <div className="text-xs font-semibold text-slate-200">Category</div>
      <div className="mt-2 hidden flex-wrap gap-2 md:flex">
        {groups.map((g) => {
          const gid = g.groupId ?? "overall";
          const active = gid === value;
          return (
            <button
              key={gid}
              type="button"
              onClick={() => apply(gid)}
              className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2 md:hidden">
        <select
          value={value}
          onChange={(e) => apply(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
          aria-label="Tournament category selector"
        >
          {groups.map((g) => {
            const gid = g.groupId ?? "overall";
            return (
              <option key={gid} value={gid}>
                {g.label}
              </option>
            );
          })}
        </select>

        <p className="mt-2 text-[11px] text-slate-400">
          Viewing: {groupLabelById.get(value) ?? "Overall"}
        </p>
      </div>
    </div>
  );
}

