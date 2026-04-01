"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createManualFixtureAction,
  createManualKnockoutMatchAction,
} from "@/src/features/matches/organizer/actions/match-actions";

const ROUND_PRESETS = [
  "Round 1",
  "Round 2",
  "Quarter Final",
  "Semi Final",
  "Third Place",
  "Final",
] as const;
const KNOCKOUT_SLOTS = ["QF1", "QF2", "QF3", "QF4", "SF1", "SF2", "F1", "TP1"] as const;

export function ManualFixtureCreateCard({
  tournamentId,
  teams,
}: {
  tournamentId: string;
  teams: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [roundLabel, setRoundLabel] = useState<string>(ROUND_PRESETS[0]);
  const [roundPreset, setRoundPreset] = useState<string>("Round 1");
  const [scheduledAt, setScheduledAt] = useState("");
  const [slotCode, setSlotCode] = useState<string>("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [homeSourceInput, setHomeSourceInput] = useState("");
  const [awaySourceInput, setAwaySourceInput] = useState("");
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const disabled = pending || teams.length < 2;

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const isKnockout = slotCode.trim() !== "";
      const res = isKnockout
        ? await createManualKnockoutMatchAction({
            tournamentId,
            slotCode: slotCode.trim(),
            homeTeamId: homeTeamId || null,
            awayTeamId: awayTeamId || null,
            scheduledAt: scheduledAt || null,
            venue: venue.trim() || null,
            notes: notes.trim() || null,
            homeSource: !homeTeamId ? (homeSourceInput.trim() || suggestedSource(slotCode, "home")) : null,
            awaySource: !awayTeamId ? (awaySourceInput.trim() || suggestedSource(slotCode, "away")) : null,
          })
        : await createManualFixtureAction({
            tournamentId,
            homeTeamId,
            awayTeamId,
            roundLabel: roundLabel.trim() || null,
            scheduledAt: scheduledAt || null,
          });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setMessage({
        kind: "success",
        text: isKnockout ? `Knockout match ${slotCode} created.` : "Manual fixture created.",
      });
      setHomeTeamId("");
      setAwayTeamId("");
      setRoundPreset("Round 1");
      setRoundLabel("");
      setScheduledAt("");
      setSlotCode("");
      setVenue("");
      setNotes("");
      setHomeSourceInput("");
      setAwaySourceInput("");
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <h2 className="text-sm font-semibold text-slate-100">Manual fixture create</h2>
      <p className="mt-1 text-xs text-slate-500">
        Create one fixture manually from approved teams.
      </p>
      {message ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            message.kind === "success"
              ? "border-emerald-800 bg-emerald-950/20 text-emerald-200"
              : "border-red-800 bg-red-950/20 text-red-200"
          }`}
        >
          {message.text}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Knockout slot (optional)</span>
          <select
            value={slotCode}
            onChange={(e) => {
              const value = e.target.value;
              setSlotCode(value);
              if (value) {
                setRoundLabel(roundLabelFromSlot(value));
                setHomeSourceInput(suggestedSource(value, "home"));
                setAwaySourceInput(suggestedSource(value, "away"));
              } else {
                setHomeSourceInput("");
                setAwaySourceInput("");
              }
            }}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">None (regular fixture)</option>
            {KNOCKOUT_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Home team</span>
          <select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Select home team</option>
            {teams.map((t) => (
              <option key={`h-${t.id}`} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Away team</span>
          <select
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Select away team</option>
            {teams.map((t) => (
              <option key={`a-${t.id}`} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Stage preset</span>
          <select
            value={roundPreset}
            onChange={(e) => {
              const value = e.target.value;
              setRoundPreset(value);
              if (value !== "Custom") setRoundLabel(value);
            }}
            className={inputClass}
            disabled={disabled}
          >
            {ROUND_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
            <option value="Custom">Custom</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Round label</span>
          <input
            value={roundLabel}
            onChange={(e) => setRoundLabel(e.target.value)}
            className={inputClass}
            placeholder="Quarter Final / Semi Final / Final"
            disabled={disabled || roundPreset !== "Custom"}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Kickoff (optional)</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputClass}
            disabled={disabled}
          />
        </label>
      </div>
      {slotCode ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Venue (optional)</span>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={inputClass}
              placeholder="Court 1"
              disabled={disabled}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Notes (optional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Special instructions"
              disabled={disabled}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Home source (optional)</span>
            <input
              value={homeSourceInput}
              onChange={(e) => setHomeSourceInput(e.target.value)}
              className={inputClass}
              placeholder={suggestedSource(slotCode, "home")}
              disabled={disabled || Boolean(homeTeamId)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Away source (optional)</span>
            <input
              value={awaySourceInput}
              onChange={(e) => setAwaySourceInput(e.target.value)}
              className={inputClass}
              placeholder={suggestedSource(slotCode, "away")}
              disabled={disabled || Boolean(awayTeamId)}
            />
          </label>
          <p className="sm:col-span-2 text-[11px] text-slate-500">
            Tip: leave teams empty to create a shell match from sources. Supported formats: <code>winner:QF1</code>, <code>loser:SF1</code>, <code>standing:1</code>, <code>group:&lt;group_id&gt;:1</code>.
          </p>
        </div>
      ) : null}
      <div className="mt-4">
        <button
          type="button"
          onClick={submit}
          disabled={disabled || (!slotCode && (!homeTeamId || !awayTeamId))}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Creating…" : slotCode ? "Create knockout match" : "Create manual fixture"}
        </button>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100";

function roundLabelFromSlot(slotCode: string) {
  if (slotCode.startsWith("QF")) return "Quarter Final";
  if (slotCode.startsWith("SF")) return "Semi Final";
  if (slotCode === "F1") return "Final";
  if (slotCode === "TP1") return "Third Place";
  return slotCode;
}

function suggestedSource(slotCode: string, side: "home" | "away") {
  const map: Record<string, { home: string; away: string }> = {
    SF1: { home: "winner:QF1", away: "winner:QF2" },
    SF2: { home: "winner:QF3", away: "winner:QF4" },
    F1: { home: "winner:SF1", away: "winner:SF2" },
    TP1: { home: "loser:SF1", away: "loser:SF2" },
  };
  return map[slotCode]?.[side] ?? "team:<id>";
}
