import Link from "next/link";
import type { PublicTournamentCardData } from "@/src/features/tournaments/types";
import { StatusBadge } from "./status-badge";

function formatDate(date: string | null | undefined) {
  if (!date) return "TBA";
  // Stable, timezone-safe YYYY-MM-DD display.
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "TBA";
  const iso = d.toISOString();
  return iso.slice(0, 10);
}

export function TournamentCard({
  tournament,
  variant = "grid",
}: {
  tournament: PublicTournamentCardData;
  variant?: "grid" | "list";
}) {
  const start = formatDate(tournament.startDate);

  if (variant === "list") {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.25)] hover:border-emerald-400/20 transition-colors">
        <div className="flex gap-4">
          <div className="relative h-20 w-28 overflow-hidden rounded-xl border border-white/10 bg-slate-950/30">
            {tournament.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tournament.coverImageUrl}
                alt=""
                className="h-full w-full object-cover opacity-90"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute left-3 top-3">
              <StatusBadge
                status={tournament.status}
                isRegistrationOpen={tournament.isRegistrationOpen}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-50">
                  {tournament.name}
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  {tournament.organizerName ?? "Kulhivaru+"} · {tournament.sport}
                </p>
                {tournament.location ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {tournament.location}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[11px] text-slate-400">Starts</div>
                <div className="text-sm font-semibold text-slate-50">
                  {start}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {tournament.teamCount != null ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                  {tournament.teamCount} teams
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                  Teams: —
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                Categories: —
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/t/${tournament.slug}`}
                className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Open Tournament
              </Link>
              <Link
                href={`/t/${tournament.slug}/fixtures`}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
              >
                View Matches
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-md hover:border-emerald-400/20 transition-colors">
      <div className="relative h-32 overflow-hidden">
        {tournament.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tournament.coverImageUrl}
            alt=""
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="absolute left-4 top-4">
          <StatusBadge
            status={tournament.status}
            isRegistrationOpen={tournament.isRegistrationOpen}
          />
        </div>
        {tournament.logoUrl ? (
          <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tournament.logoUrl} alt="" className="h-10 w-10 rounded-xl object-contain" />
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-slate-50">
          {tournament.name}
        </h3>
        <p className="mt-1 text-xs text-slate-300">
          {tournament.organizerName ?? "Kulhivaru+"}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {tournament.sport}
          {tournament.location ? ` · ${tournament.location}` : ""}
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] text-slate-400">Starts</div>
            <div className="text-sm font-semibold text-slate-50">{start}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] text-slate-400">Teams</div>
            <div className="text-sm font-semibold text-slate-50">
              {tournament.teamCount ?? "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/t/${tournament.slug}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Open Tournament
          </Link>
        </div>
      </div>
    </article>
  );
}

