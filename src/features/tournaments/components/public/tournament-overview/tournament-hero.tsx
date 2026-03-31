import Image from "next/image";
import Link from "next/link";
import { TournamentGroupSelector } from "./tournament-group-selector";
import { TournamentShareButton } from "./tournament-share-button";

function StatusBadge({
  variant,
  label,
}: {
  variant: "live" | "ongoing" | "upcoming" | "completed";
  label: string;
}) {
  const cls =
    variant === "live"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : variant === "ongoing"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : variant === "upcoming"
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
          : "border-white/10 bg-white/5 text-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold ${cls} shadow-[0_0_0_1px_rgba(0,0,0,0.05)]`}
    >
      {label}
    </span>
  );
}

interface GroupOption {
  groupId: string | null;
  label: string;
  teamsCount: number;
}

interface TournamentMeta {
  name: string;
  sport: string;
  location: string | null;
  organizerName: string | null;
  startDate: string | null;
  endDate: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
}

export function TournamentHero({
  slug,
  tournament,
  groups,
  selectedGroupId,
  effectiveStatus,
  statusLabel,
  primaryCta,
  groupLabel,
}: {
  slug: string;
  tournament: TournamentMeta;
  groups: GroupOption[];
  selectedGroupId: string | null;
  effectiveStatus: "live" | "ongoing" | "upcoming" | "completed";
  statusLabel: string;
  primaryCta: { href: string; label: string };
  groupLabel: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-xl shadow-[0_24px_120px_rgba(0,0,0,0.45)] lg:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/25 via-white/10 to-cyan-500/20" />
        {tournament.bannerUrl ? (
          <Image
            src={tournament.bannerUrl}
            alt=""
            fill
            className="object-contain object-center p-2 opacity-55"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/50 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/60 to-slate-950/85" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/25 bg-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:h-28 sm:w-28">
                  {tournament.logoUrl ? (
                    <Image
                      src={tournament.logoUrl}
                      alt=""
                      fill
                      className="object-contain object-center p-1.5"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-200">
                      T
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
                    {tournament.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-slate-100">
                      {tournament.sport}
                    </span>
                    {tournament.location ? (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-slate-100">
                        {tournament.location}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    Organized by{" "}
                    <span className="font-semibold text-slate-50">
                      {tournament.organizerName ?? "—"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {tournament.startDate ? (
                      <>
                        {tournament.startDate}
                        {tournament.endDate ? ` → ${tournament.endDate}` : ""}
                      </>
                    ) : (
                      "Date TBD"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3">
                <StatusBadge variant={effectiveStatus} label={statusLabel} />
                <div className="w-full max-w-[260px]">
                  <TournamentGroupSelector
                    groups={groups}
                    selectedGroupId={selectedGroupId}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <TournamentShareButton slug={slug} />
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-400"
              >
                Follow
              </button>
            </div>

            <Link
              href={primaryCta.href}
              className="mt-auto inline-flex w-full items-center justify-center rounded-2xl border border-emerald-300/50 bg-emerald-500/25 px-5 py-3 text-sm font-semibold text-emerald-50 shadow-[0_12px_30px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5 hover:bg-emerald-500/35"
            >
              {primaryCta.label} →
            </Link>

            <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
              <div className="text-xs font-semibold text-slate-200">
                Currently viewing
              </div>
              <div className="mt-1 text-sm text-slate-50">{groupLabel}</div>
              <div className="mt-2 text-[11px] text-slate-400">
                Switch categories to update standings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
