"use client";

import { useEffect, useState } from "react";
import type { OrganizerTournamentMatchRow } from "../queries/get-tournament-matches";
import { updateMatchDetailsAction } from "../actions/match-actions";

interface MatchEditorDialogProps {
  open: boolean;
  tournamentId: string;
  teams: Array<{ id: string; name: string }>;
  match: OrganizerTournamentMatchRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MatchEditorDialog({
  open,
  tournamentId,
  teams,
  match,
  onClose,
  onSuccess,
}: MatchEditorDialogProps) {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [roundLabel, setRoundLabel] = useState("");
  const [dateTimeLocal, setDateTimeLocal] = useState(""); // yyyy-MM-ddTHH:mm
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && match) {
      setError(null);
      setHomeTeamId(match.homeTeamId ?? "");
      setAwayTeamId(match.awayTeamId ?? "");
      setRoundLabel(match.roundLabel ?? "");
      setDateTimeLocal(match.scheduledAt ? toLocalInput(match.scheduledAt) : "");
    }
  }, [open, match]);

  if (!open || !match) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!homeTeamId || !awayTeamId) {
      setError("Please select both home and away teams.");
      return;
    }
    if (homeTeamId === awayTeamId) {
      setError("Home and away teams must be different.");
      return;
    }
    setSubmitting(true);
    const scheduledAt = dateTimeLocal ? new Date(dateTimeLocal).toISOString() : null;
    const res = await updateMatchDetailsAction({
      tournamentId,
      matchId: match.id,
      homeTeamId,
      awayTeamId,
      scheduledAt,
      roundLabel: roundLabel.trim() || null,
    });
    setSubmitting(false);
    if (!res.ok) return setError(res.error);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-50">Edit match</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-4">
          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <div className="text-sm text-slate-300">
            <span className="font-medium text-slate-100">{match.homeTeamName}</span> vs{" "}
            <span className="font-medium text-slate-100">{match.awayTeamName}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-200">Home team</label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="">Select home team</option>
                {teams.map((t) => (
                  <option key={`home-${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">Away team</label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="">Select away team</option>
                {teams.map((t) => (
                  <option key={`away-${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">Round label</label>
            <input
              value={roundLabel}
              onChange={(e) => setRoundLabel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="e.g. Matchday 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">Kickoff time</label>
            <input
              type="datetime-local"
              value={dateTimeLocal}
              onChange={(e) => setDateTimeLocal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave empty to keep it unscheduled.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

