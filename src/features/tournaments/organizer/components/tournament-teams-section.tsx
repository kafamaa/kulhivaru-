"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TournamentTeamsData } from "../queries/get-tournament-teams";
import { TournamentTeamsList } from "./tournament-teams-list";
import { InviteTeamDialog } from "./invite-team-dialog";
import { ImportCsvDialog } from "./import-csv-dialog";

interface TournamentTeamsSectionProps {
  data: TournamentTeamsData;
}

export function TournamentTeamsSection({ data }: TournamentTeamsSectionProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const router = useRouter();

  const handleInviteSuccess = () => {
    router.refresh();
  };

  const pendingCount = data.entries.filter((e) => e.status === "pending").length;
  const approvedCount = data.entries.filter((e) => e.status === "approved").length;

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Teams & registration</h1>
          <p className="mt-1 text-sm text-slate-300">
            Manage entries, approvals and rosters for{" "}
            <span className="font-medium text-slate-200">{data.tournamentName}</span>.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>{data.entries.length} team{data.entries.length !== 1 ? "s" : ""} total</span>
            {approvedCount > 0 && (
              <span className="text-emerald-400">{approvedCount} approved</span>
            )}
            {pendingCount > 0 && (
              <span className="text-amber-400">{pendingCount} pending</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="shrink-0 rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/35"
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-slate-100"
          >
            + Add team
          </button>
        </div>
      </header>

      <TournamentTeamsList
        tournamentId={data.tournamentId}
        entries={data.entries}
        onInviteClick={() => setInviteOpen(true)}
      />
      <InviteTeamDialog
        tournamentId={data.tournamentId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={handleInviteSuccess}
      />
      <ImportCsvDialog
        tournamentId={data.tournamentId}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
