"use client";

import Image from "next/image";
import Link from "next/link";

interface SummaryData {
  teamsCount: number;
  matchesCount: number;
  categoriesCount: number;
  currentPhaseLabel: string;
}

const railCardClass =
  "min-w-[170px] rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/[0.1]";

function SponsorChip({
  name,
  logoUrl,
  tier,
}: {
  name: string;
  logoUrl: string | null;
  tier?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tierBorderClass = getTierBorderClass(tier);

  return (
    <div className={`flex items-center gap-2 rounded-xl border bg-white/[0.07] px-3 py-2 ${tierBorderClass}`}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-[10px] font-bold text-slate-100">
        {logoUrl ? <Image src={logoUrl} alt="" fill className="object-contain p-0.5" /> : initials}
      </span>
      <span className="text-xs font-semibold text-slate-200">{name}</span>
    </div>
  );
}

export function TournamentSummaryCards({
  slug,
  summary,
  sponsors,
}: {
  slug: string;
  summary: SummaryData;
  sponsors: Array<{ id: string; name: string; logoUrl: string | null; tier?: string | null }>;
}) {
  const items =
    sponsors.length > 0
      ? sponsors
      : [{ id: "fallback", name: "Sponsor", logoUrl: null, tier: null }];

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-2.5 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-x-visible">
          <Link href={`/t/${slug}/teams`} className={railCardClass}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Teams
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-50 tabular-nums">
              {summary.teamsCount}
            </div>
          </Link>
          <Link href={`/t/${slug}/fixtures`} className={railCardClass}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Matches
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-50 tabular-nums">
              {summary.matchesCount}
            </div>
          </Link>
          <Link href={`/t/${slug}/standings`} className={railCardClass}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Categories
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-50 tabular-nums">
              {summary.categoriesCount}
            </div>
          </Link>
          <Link href={`/t/${slug}/standings`} className={railCardClass}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Current phase
            </div>
            <div className="mt-1.5 truncate text-lg font-bold text-slate-50">
              {summary.currentPhaseLabel}
            </div>
          </Link>
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Sponsors
            </span>
          </div>
          <div className="relative w-full py-2">
            <div
              className="inline-flex min-w-max items-center gap-2 pl-full pr-3"
              style={{ animation: "sponsor-pass-rtl 20s linear infinite" }}
            >
              {items.map((s) => (
                <SponsorChip key={s.id} name={s.name} logoUrl={s.logoUrl} tier={s.tier} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .pl-full {
          padding-left: 100%;
        }
        @keyframes sponsor-pass-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </section>
  );
}

function getTierBorderClass(tier?: string | null): string {
  const t = (tier ?? "").trim().toLowerCase();
  if (t.includes("gold")) return "border-[#D4AF37]/60";
  if (t.includes("silver")) return "border-[#C0C0C0]/60";
  if (t.includes("bronze")) return "border-[#CD7F32]/60";
  if (t.includes("platinum")) return "border-[#E5E4E2]/60";
  if (t.includes("diamond")) return "border-[#7DD3FC]/60";
  if (t.includes("partner")) return "border-[#34D399]/60";
  return "border-white/15";
}
