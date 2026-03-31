"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutList, Plus } from "lucide-react";

import type { OrganizerOrganization } from "../../types";
import { useOrganizerWorkspace } from "./organizer-workspace-context";

interface TopBarProps {
  title?: string;
  organizations?: OrganizerOrganization[];
  selectedOrgId?: string | null;
}

export function TopBar({
  title = "Organizer Dashboard",
  organizations = [],
  selectedOrgId = null,
}: TopBarProps) {
  const pathname = usePathname();
  const { activeTournament } = useOrganizerWorkspace();
  const singleOrg = organizations.length === 1 ? organizations[0] : null;
  const selectedOrg =
    (selectedOrgId && organizations.find((o) => o.id === selectedOrgId)) || null;

  const onMatchControl = pathname.startsWith("/organizer/match/");
  const showTournamentCrumb = onMatchControl && activeTournament;

  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-col border-b border-slate-800/80 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      {showTournamentCrumb ? (
        <div className="flex items-center gap-2 border-b border-slate-800/60 bg-slate-900/40 px-4 py-2 text-sm">
          <Link
            href={`/organizer/t/${activeTournament.id}/matches`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            <span className="max-w-[200px] truncate sm:max-w-xs">{activeTournament.name}</span>
            <span className="hidden text-slate-500 sm:inline">· Matches</span>
          </Link>
          <span className="text-slate-600">|</span>
          <Link
            href={`/organizer/t/${activeTournament.id}`}
            className="text-slate-400 hover:text-slate-200"
          >
            Tournament overview
          </Link>
        </div>
      ) : null}
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-lg font-semibold text-slate-50">{title}</h1>
          {organizations.length > 1 ? (
            <select
              className="max-w-[10rem] rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-none"
              value={selectedOrgId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) window.location.href = `/organizer?org=${v}`;
              }}
              aria-label="Select organization"
            >
              <option value="">All organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          ) : singleOrg ? (
            <div
              className="hidden max-w-[14rem] items-center gap-2 truncate rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 md:flex"
              title={`Organization: ${singleOrg.name}`}
            >
              <span className="shrink-0 text-slate-400">Org</span>
              <span className="truncate font-medium">{singleOrg.name}</span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {selectedOrg && (
            <span
              className="hidden max-w-[8rem] truncate rounded-full border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300 md:inline-block"
              title={selectedOrg.name}
            >
              {selectedOrg.name}
            </span>
          )}
          <Link
            href="/organizer/tournaments/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">New tournament</span>
            <span className="sm:hidden">New</span>
          </Link>
          <Link
            href="/organizer/tournaments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800"
          >
            <LayoutList className="h-4 w-4 text-slate-400" aria-hidden />
            <span className="hidden sm:inline">All tournaments</span>
            <span className="sm:hidden">List</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
