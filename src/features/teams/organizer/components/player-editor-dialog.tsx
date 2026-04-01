"use client";

import { useEffect, useState } from "react";
import type { TeamRosterPlayer } from "../queries/get-team-roster";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";

interface PlayerEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: TeamRosterPlayer | null;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    jerseyNumber: string;
    nickname: string;
    dob: string;
    idNumber: string;
    position: string;
    imageUrl: string;
  }) => void;
  submitting?: boolean;
  error?: string | null;
  teamId: string;
}

export function PlayerEditorDialog({
  open,
  mode,
  initial = null,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
  teamId,
}: PlayerEditorDialogProps) {
  const [name, setName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [dob, setDob] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [position, setPosition] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setJerseyNumber(initial?.jerseyNumber ?? "");
      setNickname(initial?.nickname ?? "");
      setDob(initial?.dob ?? "");
      setIdNumber(initial?.idNumber ?? "");
      setPosition(initial?.position ?? "");
      setImageUrl(initial?.imageUrl ?? "");
      setUploadError(null);
    }
  }, [open, initial]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const path = `players/${teamId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("player-avatars")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        setUploadError(error.message);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("player-avatars").getPublicUrl(path);
        setImageUrl(publicUrl);
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-50">
            {mode === "create" ? "Add player" : "Edit player"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, jerseyNumber, nickname, dob, idNumber, position, imageUrl });
          }}
        >
          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-200">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="Player name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">Jersey number</label>
            <input
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Nickname
            </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="Optional display name"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Date of birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                ID number
              </label>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                placeholder="National / federation ID"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">Position</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="e.g. Forward"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Profile photo
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Upload a headshot or paste an existing image URL.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700"
            />
            {uploadError && (
              <p className="mt-1 text-xs text-red-400">{uploadError}</p>
            )}
            <label className="mt-3 block text-xs font-medium text-slate-400">
              Or image URL
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="https://..."
            />
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
              disabled={submitting || uploading}
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

