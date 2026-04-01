"use client";

import { useState } from "react";
import { importTeamsAndPlayersCsvAction } from "../actions/team-entries-actions";

interface ImportCsvDialogProps {
  tournamentId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function parseFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export function ImportCsvDialog({
  tournamentId,
  open,
  onClose,
  onSuccess,
}: ImportCsvDialogProps) {
  const [teamsFile, setTeamsFile] = useState<File | null>(null);
  const [playersFile, setPlayersFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [entryStatus, setEntryStatus] = useState<"approved" | "pending">("approved");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  async function handleImport() {
    setError(null);
    setSuccess(null);
    if (!teamsFile) {
      setError("Please upload teams CSV.");
      return;
    }

    try {
      setBusy(true);
      const teamsCsvText = await parseFileAsText(teamsFile);
      const playersCsvText = playersFile ? await parseFileAsText(playersFile) : "";
      const result = await importTeamsAndPlayersCsvAction({
        tournamentId,
        teamsCsvText,
        playersCsvText,
        defaultEntryStatus: entryStatus,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        `Imported: ${result.data.teamsCreated} teams created, ${result.data.entriesAdded} entries added, ${result.data.playersCreated} players created, ${result.data.playersUpdated} players updated. Skipped ${result.data.skippedRows} rows.`
      );
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-50">Import Teams + Players (CSV)</h2>
          <p className="mt-1 text-xs text-slate-400">
            One-shot import without SQL. Upload teams CSV (required) and players CSV (optional).
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300">Teams CSV columns:</p>
            <p className="mt-1">name, slug, logo_url, status(optional)</p>
            <p className="mt-2 font-medium text-slate-300">Players CSV columns:</p>
            <p className="mt-1">
              team_slug or team_name, name, position, image_url, nickname, dob, id_number
            </p>
          </div>

          <label className="block text-sm text-slate-200">
            Teams CSV (required)
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-200 hover:file:bg-slate-700"
              onChange={(e) => setTeamsFile(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </label>

          <label className="block text-sm text-slate-200">
            Players CSV (optional)
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-200 hover:file:bg-slate-700"
              onChange={(e) => setPlayersFile(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </label>

          <label className="block text-sm text-slate-200">
            Default entry status for imported teams
            <select
              value={entryStatus}
              onChange={(e) => setEntryStatus(e.target.value as "approved" | "pending")}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              disabled={busy}
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </label>

          {error ? (
            <div className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            disabled={busy}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            disabled={busy}
          >
            {busy ? "Importing…" : "Import CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
