"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Coins,
  Image as ImageIcon,
  LayoutDashboard,
  ListOrdered,
  Network,
  Settings2,
  Trophy,
  Users,
} from "lucide-react";

import { useOrganizerWorkspace } from "./organizer-workspace-context";

const MAIN_LINKS = [
  { href: "/organizer", label: "Dashboard", hint: "Home", Icon: LayoutDashboard },
  { href: "/organizer/tournaments", label: "Tournaments", hint: "All events", Icon: Trophy },
  { href: "/organizer/settings", label: "Organization", hint: "Org profile", Icon: Settings2 },
] as const;

const TOURNAMENT_LINKS = [
  { href: "", label: "Overview", hint: "Health & actions", Icon: LayoutDashboard },
  { href: "teams", label: "Teams", hint: "Registration", Icon: Users },
  { href: "structure", label: "Structure", hint: "Format & phases", Icon: Network },
  { href: "matches", label: "Matches", hint: "Fixtures & results", Icon: Calendar },
  { href: "standings", label: "Standings", hint: "Tables", Icon: ListOrdered },
  { href: "finance", label: "Finance", hint: "Fees & payouts", Icon: Coins },
  { href: "media", label: "Media", hint: "Photos & clips", Icon: ImageIcon },
  { href: "reports", label: "Reports", hint: "Exports", Icon: BarChart3 },
  { href: "settings", label: "Tournament settings", hint: "Details", Icon: Settings2 },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { activeTournament } = useOrganizerWorkspace();

  const pathTournamentMatch = pathname.match(/^\/organizer\/t\/([^/]+)/);
  const tournamentIdFromPath = pathTournamentMatch?.[1] ?? null;
  const effectiveTournamentId = tournamentIdFromPath ?? activeTournament?.id ?? null;
  const baseTournamentPath = effectiveTournamentId
    ? `/organizer/t/${effectiveTournamentId}`
    : "";

  const onMatchControl = pathname.startsWith("/organizer/match/");
  const tournamentLabel = activeTournament?.name ?? "Tournament";

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950">
      <div className="flex h-14 items-center border-b border-slate-800/80 px-4">
        <Link href="/organizer" className="text-sm font-semibold text-slate-100 hover:text-emerald-300">
          Organizer
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Main">
        {MAIN_LINKS.map((link) => {
          const isActive =
            link.href === "/organizer"
              ? pathname === "/organizer" || pathname === "/organizer/"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.Icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">{link.label}</span>
                <span className="block text-[11px] font-normal text-slate-500">{link.hint}</span>
              </span>
            </Link>
          );
        })}

        {baseTournamentPath && (
          <>
            <div className="my-3 border-t border-slate-800/80 pt-3">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tournament workspace
              </p>
              <p className="mt-1 line-clamp-2 px-3 text-xs font-medium text-slate-300" title={tournamentLabel}>
                {onMatchControl ? "From match · " : ""}
                {tournamentLabel}
              </p>
              {onMatchControl ? (
                <p className="mt-1 px-3 text-[11px] text-slate-500">
                  Use these links anytime while editing a match.
                </p>
              ) : null}
            </div>
            {TOURNAMENT_LINKS.map((link) => {
              const href = link.href ? `${baseTournamentPath}/${link.href}` : baseTournamentPath;
              const isActive =
                link.href === ""
                  ? pathname === baseTournamentPath || pathname === `${baseTournamentPath}/`
                  : pathname === href || pathname.startsWith(`${href}/`);
              const Icon = link.Icon;
              return (
                <Link
                  key={link.href || "overview"}
                  href={href}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-medium leading-tight">{link.label}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{link.hint}</span>
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
