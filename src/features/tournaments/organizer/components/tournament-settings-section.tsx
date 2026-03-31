"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";
import {
  TOURNAMENT_STATUSES,
  tournamentSettingsSchema,
  type TournamentSettingsFormValues,
} from "@/src/features/tournaments/organizer/schemas/tournament-settings-schema";
import {
  archiveTournamentAction,
  updateTournamentSettingsAction,
} from "@/src/features/tournaments/organizer/actions/tournament-settings-actions";
import type { OrganizerTournamentSettingsData } from "@/src/features/tournaments/organizer/queries/get-tournament-settings";

export function TournamentSettingsSection({
  data,
}: {
  data: OrganizerTournamentSettingsData;
}) {
  const [pending, startTransition] = useTransition();
  const [archiving, startArchive] = useTransition();
  const [message, setMessage] = useState<
    { kind: "success" | "error"; text: string } | undefined
  >(undefined);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<TournamentSettingsFormValues>({
    resolver: zodResolver(tournamentSettingsSchema),
    defaultValues: data.defaults,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(data.defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  const statusOptions = useMemo(() => TOURNAMENT_STATUSES, []);

  function onSubmit(values: TournamentSettingsFormValues) {
    setMessage(undefined);
    startTransition(async () => {
      const res = await updateTournamentSettingsAction({
        tournamentId: data.id,
        values,
      });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as any, { message: v });
          }
        }
        return;
      }
      setMessage({ kind: "success", text: "Settings saved." });
    });
  }

  function runArchive() {
    setMessage(undefined);
    startArchive(async () => {
      const res = await archiveTournamentAction({ tournamentId: data.id });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setConfirmArchive(false);
      setMessage({
        kind: "success",
        text: "Tournament archived. You can still view data, but it’s hidden from public lists.",
      });
    });
  }

  async function handleBrandUpload(
    file: File,
    kind: "logo" | "cover"
  ): Promise<void> {
    setUploadError(null);
    kind === "logo" ? setUploadingLogo(true) : setUploadingCover(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `branding/${data.id}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("tournament-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        });
      if (error) {
        setUploadError(error.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("tournament-media").getPublicUrl(path);
      if (kind === "logo") form.setValue("logoUrl", publicUrl, { shouldDirty: true });
      else form.setValue("coverImageUrl", publicUrl, { shouldDirty: true });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      kind === "logo" ? setUploadingLogo(false) : setUploadingCover(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-slate-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Edit basics and branding. Archive when the tournament is finished or
            cancelled.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Slug: <span className="font-mono text-slate-300">{data.slug}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/organizer/t/${data.id}`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            ← Overview
          </Link>
          <Link
            href={`/t/${data.slug}`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            View public
          </Link>
        </div>
      </header>

      {message && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            message.kind === "success"
              ? "border-emerald-800 bg-emerald-950/20 text-emerald-200"
              : "border-red-800 bg-red-950/20 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Basic information
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              These fields power public pages and organizer dashboards.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Tournament name"
              error={form.formState.errors.name?.message}
            >
              <input
                className={inputClass(Boolean(form.formState.errors.name))}
                {...form.register("name")}
                placeholder="Kulhivaru+ Cup 2026"
              />
            </Field>

            <Field
              label="Sport"
              error={form.formState.errors.sport?.message}
            >
              <input
                className={inputClass(Boolean(form.formState.errors.sport))}
                {...form.register("sport")}
                placeholder="Football"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Start date"
              error={form.formState.errors.startDate?.message}
            >
              <input
                type="date"
                className={inputClass(Boolean(form.formState.errors.startDate))}
                {...form.register("startDate")}
              />
            </Field>
            <Field
              label="End date"
              error={form.formState.errors.endDate?.message}
            >
              <input
                type="date"
                className={inputClass(Boolean(form.formState.errors.endDate))}
                {...form.register("endDate")}
              />
            </Field>
          </div>

          <Field
            label="Location"
            hint="Shown on public pages (e.g. “Kandy, Sri Lanka”)."
            error={form.formState.errors.location?.message}
          >
            <input
              className={inputClass(Boolean(form.formState.errors.location))}
              {...form.register("location")}
              placeholder="City, Country"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Status"
              hint="Controls visibility in public lists."
              error={form.formState.errors.status?.message}
            >
              <select
                className={inputClass(Boolean(form.formState.errors.status))}
                {...form.register("status")}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Registration"
              hint="MVP flag for public registration state."
              error={form.formState.errors.isRegistrationOpen?.message}
            >
              <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-500"
                  {...form.register("isRegistrationOpen")}
                />
                <span className="text-sm text-slate-200">
                  Registration open
                </span>
              </label>
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Branding</h2>
            <p className="mt-1 text-xs text-slate-500">
              Upload logo/cover directly to storage, or paste an image URL.
            </p>
          </div>

          {uploadError ? (
            <p className="rounded-lg border border-red-800 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {uploadError}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Logo URL"
              error={form.formState.errors.logoUrl?.message}
            >
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleBrandUpload(f, "logo");
                    e.currentTarget.value = "";
                  }}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700 disabled:opacity-60"
                />
                <input
                  className={inputClass(Boolean(form.formState.errors.logoUrl))}
                  {...form.register("logoUrl")}
                  placeholder="https://…/logo.png"
                />
                {uploadingLogo ? (
                  <p className="text-xs text-slate-400">Uploading logo...</p>
                ) : null}
              </div>
            </Field>
            <Field
              label="Cover image URL"
              error={form.formState.errors.coverImageUrl?.message}
            >
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleBrandUpload(f, "cover");
                    e.currentTarget.value = "";
                  }}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700 disabled:opacity-60"
                />
                <input
                  className={inputClass(
                    Boolean(form.formState.errors.coverImageUrl)
                  )}
                  {...form.register("coverImageUrl")}
                  placeholder="https://…/banner.jpg"
                />
                {uploadingCover ? (
                  <p className="text-xs text-slate-400">Uploading cover image...</p>
                ) : null}
              </div>
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Changes save via server action (RLS enforced).
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="space-y-3 rounded-xl border border-red-900/80 bg-red-950/20 p-4">
        <div>
          <h2 className="text-sm font-semibold text-red-300">Danger zone</h2>
          <p className="mt-1 text-xs text-red-200">
            Archiving hides the tournament from public lists. Data remains for
            audit/history.
          </p>
        </div>

        {!confirmArchive ? (
          <button
            type="button"
            onClick={() => setConfirmArchive(true)}
            className="rounded-lg border border-red-800 bg-red-950/30 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-950/50"
          >
            Archive tournament
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-200">
              Confirm archiving{" "}
              <span className="font-semibold">{data.name}</span>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runArchive}
                disabled={archiving}
                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-red-400 disabled:opacity-60"
              >
                {archiving ? "Archiving…" : "Yes, archive"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 ${
    hasError
      ? "border-red-700 focus:border-red-500 focus:ring-red-500"
      : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
  }`;
}

