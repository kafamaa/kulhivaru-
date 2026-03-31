"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { OrganizerTournamentMatchRow, OrganizerTournamentMatchesData } from "../queries/get-tournament-matches";
import { MatchEditorDialog } from "./match-editor-dialog";
import { generateRoundRobinFixturesAction } from "../actions/match-actions";
import { useRouter } from "next/navigation";

interface TournamentMatchesSectionProps {
  data: OrganizerTournamentMatchesData;
}

export function TournamentMatchesSection({ data }: TournamentMatchesSectionProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "live" | "ft">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<OrganizerTournamentMatchRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.matches.filter((m) => {
      const statusOk = statusFilter === "all" ? true : m.status === statusFilter;
      const qOk = !q
        ? true
        : `${m.homeTeamName} ${m.awayTeamName} ${m.roundLabel ?? ""}`
            .toLowerCase()
            .includes(q);
      return statusOk && qOk;
    });
  }, [data.matches, query, statusFilter]);

  const counts = useMemo(() => {
    const by: Record<string, number> = { all: data.matches.length, scheduled: 0, live: 0, ft: 0 };
    data.matches.forEach((m) => {
      if (m.status in by) by[m.status] += 1;
    });
    return by;
  }, [data.matches]);

  const openEditor = (m: OrganizerTournamentMatchRow) => {
    setEditing(m);
    setEditorOpen(true);
  };

  const show = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const generate = async () => {
    if (!confirm("Generate round robin fixtures for approved teams? This will create matches (unscheduled).")) return;
    setGenerating(true);
    const res = await generateRoundRobinFixturesAction({ tournamentId: data.tournamentId });
    setGenerating(false);
    if (res.ok) {
      show("success", "Fixtures generated.");
      router.refresh();
    } else {
      show("error", res.error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Matches & scheduling</h1>
          <p className="mt-1 text-sm text-slate-400">
            Control fixtures, kick-off times and results for{" "}
            <span className="font-medium text-slate-200">{data.tournamentName}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate fixtures"}
          </button>
          <Link
            href={`/organizer/t/${data.tournamentId}`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Back to overview
          </Link>
        </div>
      </header>

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "scheduled", "live", "ft"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatusFilter(k)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                statusFilter === k
                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {k === "all" ? "All" : k.toUpperCase()} ({counts[k] ?? 0})
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team or round…"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <div className="grid grid-cols-1 gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400 sm:grid-cols-12">
          <span className="sm:col-span-3">Round</span>
          <span className="sm:col-span-4">Match</span>
          <span className="sm:col-span-2">Kickoff</span>
          <span className="sm:col-span-1">Status</span>
          <span className="sm:col-span-2 text-right">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500">
            <p>No matches found.</p>
            {data.matches.length === 0 && (
              <p className="mt-1 text-xs text-slate-600">
                Generate fixtures to create matches.
              </p>
            )}
          </div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-1 items-center gap-2 border-b border-slate-800/80 px-4 py-3 last:border-b-0 sm:grid-cols-12"
            >
              <div className="sm:col-span-3 text-xs text-slate-400">
                {m.roundLabel ?? "—"}
              </div>
              <div className="sm:col-span-4 font-medium text-slate-100">
                {m.homeTeamName} <span className="text-slate-500">vs</span> {m.awayTeamName}
                {(m.status === "ft" || m.status === "completed") && (
                  <span className="ml-2 text-xs text-slate-400">
                    {m.homeScore ?? 0}-{m.awayScore ?? 0}
                  </span>
                )}
              </div>
              <div className="sm:col-span-2 text-xs text-slate-400">
                {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "TBD"}
              </div>
              <div className="sm:col-span-1">
                <span className={`text-xs font-medium ${
                  m.status === "live"
                    ? "text-emerald-300"
                    : m.status === "scheduled"
                      ? "text-amber-300"
                      : "text-slate-300"
                }`}>
                  {m.status}
                </span>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditor(m)}
                  className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Schedule
                </button>
                <Link
                  href={`/organizer/match/${m.id}`}
                  className="rounded-lg bg-emerald-500/20 px-2 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                >
                  Enter result
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <MatchEditorDialog
        open={editorOpen}
        tournamentId={data.tournamentId}
        match={editing}
        onClose={() => setEditorOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

