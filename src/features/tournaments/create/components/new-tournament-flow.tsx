"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createQuickTournamentAction } from "../actions/create-tournament-quick";

type StageFormat = "round_robin" | "groups_knockout" | "knockout_only";

const SPORT_OPTIONS = [
  "Football",
  "Futsal",
  "Basketball",
  "Volleyball",
  "Badminton",
  "Cricket",
  "Other",
];

const FORMAT_OPTIONS: Array<{ value: StageFormat; label: string }> = [
  { value: "round_robin", label: "Round Robin" },
  { value: "groups_knockout", label: "Round Robin + Knockout" },
  { value: "knockout_only", label: "Knockout" },
];

export function NewTournamentFlow({
  organizationId,
}: {
  organizationId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // single
  const [sport, setSport] = useState<string>("Football");
  const [tournamentName, setTournamentName] = useState<string>("");
  const [format, setFormat] = useState<StageFormat>("round_robin");

  const advancedHref = `/organizer/tournaments/new?step=basics${
    organizationId ? `&org=${organizationId}` : ""
  }`;

  const canCreate = useMemo(() => sport.trim().length > 0 && tournamentName.trim().length >= 3, [
    sport,
    tournamentName,
  ]);

  const submit = () => {
    if (!canCreate) return;
    setError(null);
    startTransition(async () => {
      const res = await createQuickTournamentAction({
        organizationId,
        type: "single",
        tournamentName,
        sport,
        formatType: format,
      });
      if (!res.ok) return setError(res.error);
      router.push(`/organizer/t/${res.tournamentId}/teams`);
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">New Tournament</h1>
        <p className="text-sm text-zinc-400">Create in seconds, or set everything up in advance.</p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-lg font-semibold text-white">Quick Tournament</h2>

          <Field label="Tournament name">
            <input
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className={inputClass}
              placeholder="Veterans Cup 2026"
            />
          </Field>

          <Field label="Sport">
            <select value={sport} onChange={(e) => setSport(e.target.value)} className={inputClass}>
              {SPORT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Format">
            <div className="grid gap-2 sm:grid-cols-1">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition",
                    f.value === format
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                      : "border-white/15 bg-black/30 text-zinc-200 hover:border-white/25",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canCreate || pending}
              onClick={submit}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {pending ? "Creating..." : "Create Tournament"}
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-lg font-semibold text-white">Advanced Setup</h2>
          <p className="text-sm text-zinc-400">
            Add divisions, define stages, set registration options, and publish when ready.
          </p>
          <a href={advancedHref} className="inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15">
            Open Advanced Setup
          </a>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40";
