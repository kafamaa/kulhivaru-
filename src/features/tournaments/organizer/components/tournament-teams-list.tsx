"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TournamentTeamEntry } from "../queries/get-tournament-teams";
import {
  updateEntryStatusAction,
  removeEntryAction,
} from "../actions/team-entries-actions";

interface TournamentTeamsListProps {
  tournamentId: string;
  entries: TournamentTeamEntry[];
  onInviteClick: () => void;
}

export function TournamentTeamsList({
  tournamentId,
  entries,
  onInviteClick,
}: TournamentTeamsListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleApprove = async (entry: TournamentTeamEntry) => {
    setBusyId(entry.id);
    const result = await updateEntryStatusAction(entry.id, "approved", tournamentId);
    setBusyId(null);
    if (result.ok) showMessage("success", `${entry.teamName} approved.`);
    else showMessage("error", result.error);
  };

  const handleReject = async (entry: TournamentTeamEntry) => {
    setBusyId(entry.id);
    const result = await updateEntryStatusAction(entry.id, "rejected", tournamentId);
    setBusyId(null);
    if (result.ok) showMessage("success", `${entry.teamName} rejected.`);
    else showMessage("error", result.error);
  };

  const handleRemove = async (entry: TournamentTeamEntry) => {
    if (!confirm(`Remove ${entry.teamName} from this tournament?`)) return;
    setBusyId(entry.id);
    const result = await removeEntryAction(entry.id, tournamentId);
    setBusyId(null);
    if (result.ok) showMessage("success", `${entry.teamName} removed.`);
    else showMessage("error", result.error);
  };

  const pending = entries.filter((e) => e.status === "pending");
  const approved = entries.filter((e) => e.status === "approved");
  const rejected = entries.filter((e) => e.status === "rejected");

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={
            message.type === "error"
              ? "rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200"
              : "rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
          }
        >
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <div className="grid grid-cols-1 border-b border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400 sm:grid-cols-12 gap-2">
          <span className="sm:col-span-5">Team</span>
          <span className="sm:col-span-2">Status</span>
          <span className="sm:col-span-5 text-right">Actions</span>
        </div>
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">
            <p>No teams registered yet.</p>
            <button
              type="button"
              onClick={onInviteClick}
              className="mt-3 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Add your first team →
            </button>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-amber-400/90 bg-amber-950/20 border-b border-slate-800">
                  Pending ({pending.length})
                </div>
                {pending.map((entry) => (
                  <TeamRow
                    key={entry.id}
                    entry={entry}
                    tournamentId={tournamentId}
                    busy={busyId === entry.id}
                    onApprove={() => handleApprove(entry)}
                    onReject={() => handleReject(entry)}
                    onRemove={() => handleRemove(entry)}
                  />
                ))}
              </>
            )}
            {approved.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-emerald-400/90 bg-emerald-950/20 border-b border-slate-800">
                  Approved ({approved.length})
                </div>
                {approved.map((entry) => (
                  <TeamRow
                    key={entry.id}
                    entry={entry}
                    tournamentId={tournamentId}
                    busy={busyId === entry.id}
                    onApprove={() => handleApprove(entry)}
                    onReject={() => handleReject(entry)}
                    onRemove={() => handleRemove(entry)}
                  />
                ))}
              </>
            )}
            {rejected.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-900/60 border-b border-slate-800">
                  Rejected ({rejected.length})
                </div>
                {rejected.map((entry) => (
                  <TeamRow
                    key={entry.id}
                    entry={entry}
                    tournamentId={tournamentId}
                    busy={busyId === entry.id}
                    onApprove={() => handleApprove(entry)}
                    onReject={() => handleReject(entry)}
                    onRemove={() => handleRemove(entry)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TeamRow({
  entry,
  tournamentId,
  busy,
  onApprove,
  onReject,
  onRemove,
}: {
  entry: TournamentTeamEntry;
  tournamentId: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
}) {
  const statusStyle =
    entry.status === "approved"
      ? "text-emerald-400"
      : entry.status === "rejected"
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800/80 last:border-b-0 items-center">
      <div className="sm:col-span-5 flex items-center gap-2 min-w-0">
        {entry.teamLogoUrl ? (
          <Image
            src={entry.teamLogoUrl}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-400">
            {entry.teamName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="font-medium text-slate-100 truncate">{entry.teamName}</span>
      </div>
      <div className="sm:col-span-2">
        <span className={`text-xs font-medium capitalize ${statusStyle}`}>
          {entry.status}
        </span>
      </div>
      <div className="sm:col-span-5 flex flex-wrap justify-end gap-2">
        <Link
          href={`/team/${entry.teamId}`}
          className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          View
        </Link>
        <Link
          href={`/organizer/team/${entry.teamId}`}
          className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Roster
        </Link>
        {entry.status === "pending" && (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="rounded-lg bg-emerald-500/20 px-2 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={busy}
              className="rounded-lg border border-red-800 px-2 py-1.5 text-xs font-medium text-red-300 hover:bg-red-950/50 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {entry.status === "approved" && (
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="rounded-lg border border-slate-600 px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 disabled:opacity-50"
          >
            Reject
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-800 disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
