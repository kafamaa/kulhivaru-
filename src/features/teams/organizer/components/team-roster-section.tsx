"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TeamRosterData, TeamRosterPlayer } from "../queries/get-team-roster";
import {
  addPlayerToTeamAction,
  importPlayersCsvToTeamAction,
  removePlayerAction,
  updatePlayerAction,
} from "@/src/features/players/organizer/actions/player-actions";
import { PlayerEditorDialog } from "./player-editor-dialog";

interface TeamRosterSectionProps {
  data: TeamRosterData;
}

export function TeamRosterSection({ data }: TeamRosterSectionProps) {
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TeamRosterPlayer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(data.logoUrl);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [uploadingLogo, startUploadLogo] = useTransition();
  const [importingCsv, setImportingCsv] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    setLogoUrl(data.logoUrl);
  }, [data.logoUrl]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.players;
    return data.players.filter((p) =>
      `${p.name} ${p.position ?? ""}`.toLowerCase().includes(q)
    );
  }, [data.players, query]);

  const openCreate = () => {
    setError(null);
    setMode("create");
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: TeamRosterPlayer) => {
    setError(null);
    setMode("edit");
    setEditing(p);
    setDialogOpen(true);
  };

  const onSubmit = async (values: {
    name: string;
    jerseyNumber: string;
    nickname: string;
    dob: string;
    idNumber: string;
    position: string;
    imageUrl: string;
  }) => {
    setError(null);
    setSubmitting(true);

    if (mode === "create") {
      const res = await addPlayerToTeamAction({
        teamId: data.teamId,
        name: values.name,
        jerseyNumber: values.jerseyNumber || null,
        position: values.position || null,
        imageUrl: values.imageUrl || null,
        nickname: values.nickname || null,
        dob: values.dob || null,
        idNumber: values.idNumber || null,
      });
      setSubmitting(false);
      if (!res.ok) return setError(res.error);
      setDialogOpen(false);
      return;
    }

    if (!editing) {
      setSubmitting(false);
      return setError("No player selected");
    }

    const res = await updatePlayerAction({
      playerId: editing.id,
      teamId: data.teamId,
      name: values.name,
      jerseyNumber: values.jerseyNumber || null,
      position: values.position || null,
      imageUrl: values.imageUrl || null,
      nickname: values.nickname || null,
      dob: values.dob || null,
      idNumber: values.idNumber || null,
    });
    setSubmitting(false);
    if (!res.ok) return setError(res.error);
    setDialogOpen(false);
  };

  const remove = async (p: TeamRosterPlayer) => {
    if (!confirm(`Remove ${p.name} from the roster?`)) return;
    const res = await removePlayerAction({ playerId: p.id, teamId: data.teamId });
    if (!res.ok) alert(res.error);
  };

  async function handleTeamLogoFileChange(file: File) {
    setLogoMessage(null);
    startUploadLogo(async () => {
      try {
        const form = new FormData();
        form.append("teamId", data.teamId);
        form.append("file", file);

        const resp = await fetch("/api/team-logos/upload", {
          method: "POST",
          body: form,
        });

        const json: any = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setLogoMessage(json?.error ?? "Upload failed.");
          return;
        }

        const publicUrl = String(json.publicUrl ?? "");
        if (!publicUrl) {
          setLogoMessage("Could not generate public URL for uploaded logo.");
          return;
        }

        setLogoUrl(publicUrl);
        router.refresh();
      } catch (e) {
        setLogoMessage(e instanceof Error ? e.message : "Upload failed.");
      }
    });
  }

  async function handlePlayersCsvImport(file: File) {
    setImportMessage(null);
    setImportingCsv(true);
    try {
      const csvText = await file.text();
      const res = await importPlayersCsvToTeamAction({
        teamId: data.teamId,
        csvText,
      });
      if (!res.ok) {
        setImportMessage(res.error);
      } else {
        setImportMessage(
          `Imported ${res.data.created} new players, updated ${res.data.updated}, skipped ${res.data.skipped}.`
        );
      }
    } catch (e) {
      setImportMessage(e instanceof Error ? e.message : "Could not import CSV.");
    } finally {
      setImportingCsv(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm text-slate-300">
                {data.teamName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <h1 className="truncate text-2xl font-semibold text-slate-50">
              {data.teamName} roster
            </h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">
              {uploadingLogo ? "Uploading…" : "Upload team logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleTeamLogoFileChange(file);
                }}
              />
            </label>
            {logoMessage ? (
              <span className="text-xs text-red-300">{logoMessage}</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Add players manually to build a roster for this team.
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            Team ID: {data.teamId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/team/${data.teamId}`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            View public
          </Link>
          <label className="cursor-pointer rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/35">
            {importingCsv ? "Importing…" : "Import Players CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importingCsv}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void handlePlayersCsvImport(file);
              }}
            />
          </label>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            + Add player
          </button>
        </div>
      </header>

      {importMessage ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
          {importMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          {data.players.length} player{data.players.length !== 1 ? "s" : ""}
        </div>
        <div className="w-full sm:max-w-md">
          <p className="mb-1 text-[11px] text-slate-500">
            CSV columns: name, jersey_number, position, image_url, nickname, dob, id_number
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players…"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <div className="grid grid-cols-1 gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400 sm:grid-cols-12">
          <span className="sm:col-span-3">Player</span>
          <span className="sm:col-span-2">Jersey</span>
          <span className="sm:col-span-3">Position</span>
          <span className="sm:col-span-3">ID number</span>
          <span className="sm:col-span-1 text-right">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500">
            <p>No players found.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Add a player →
            </button>
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 items-center gap-2 border-b border-slate-800/80 px-4 py-3 last:border-b-0 sm:grid-cols-12"
            >
              <div className="sm:col-span-3 flex items-center gap-2 min-w-0">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-400">
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-medium text-slate-100">{p.name}</span>
              </div>
              <div className="sm:col-span-2 text-sm font-semibold text-slate-200">
                {p.jerseyNumber ?? "—"}
              </div>
              <div className="sm:col-span-3 text-sm text-slate-300">
                {p.position ?? "—"}
              </div>
              <div className="sm:col-span-3 text-xs text-slate-400 font-mono">
                {p.idNumber ?? "—"}
              </div>
              <div className="sm:col-span-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  className="rounded-lg border border-red-800 px-2 py-1.5 text-xs font-medium text-red-300 hover:bg-red-950/50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <PlayerEditorDialog
        open={dialogOpen}
        mode={mode}
        initial={editing}
        onClose={() => {
          setDialogOpen(false);
          setError(null);
        }}
        onSubmit={onSubmit}
        submitting={submitting}
        error={error}
        teamId={data.teamId}
      />
    </div>
  );
}

