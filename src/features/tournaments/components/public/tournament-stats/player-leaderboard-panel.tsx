import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { PlayerLeaderboardRow } from "@/src/features/tournaments/queries/get-public-tournament-stats";

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank === 1 || rank === 2 || rank === 3;
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums ${
        isTop3
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {rank}
    </span>
  );
}

function Avatar({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function PlayerLeaderboardPanel({
  title,
  rows,
  valueRenderer,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  rows: PlayerLeaderboardRow[];
  valueRenderer: (row: PlayerLeaderboardRow) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Ranked entries for the selected phase/group.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-sm font-semibold text-slate-50">{emptyTitle}</div>
          <div className="mt-2 text-sm text-slate-400">{emptyDescription}</div>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
          {rows.map((r, idx) => (
            <div
              key={r.playerId}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RankBadge rank={idx + 1} />
                <Avatar imageUrl={r.playerImageUrl} name={r.playerName} />
                <div className="min-w-0">
                  <Link
                    href={`/player/${r.playerId}`}
                    className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-200"
                  >
                    {r.playerName}
                  </Link>
                  <div className="mt-1 truncate text-xs text-slate-400">
                    {r.teamName}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                {valueRenderer(r)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

