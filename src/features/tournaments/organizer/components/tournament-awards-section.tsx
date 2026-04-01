"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setTournamentAwardAction } from "@/src/features/tournaments/organizer/actions/tournament-awards-actions";
import type { TournamentAwardsData } from "@/src/features/tournaments/organizer/queries/get-tournament-awards-data";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";

const AWARDS = [
  { key: "mvp", label: "Best Player (MVP)" },
  { key: "best_goalkeeper", label: "Best Goalkeeper" },
  { key: "best_defender", label: "Best Defender" },
  { key: "young_player", label: "Young Player" },
  { key: "top_scorer", label: "Top Scorer" },
  { key: "best_assist_provider", label: "Best Assist Provider" },
  { key: "champion_trophy", label: "Champion Trophy" },
  { key: "runner_up_trophy", label: "Runner-up Trophy" },
] as const;
type AwardKey = (typeof AWARDS)[number]["key"];
const TEAM_AWARD_KEYS: AwardKey[] = ["champion_trophy", "runner_up_trophy"];

export function TournamentAwardsSection({ data }: { data: TournamentAwardsData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectionByAward, setSelectionByAward] = useState<Record<string, string>>(
    Object.fromEntries(
      AWARDS.map((a) => [a.key, data.awards[a.key]?.playerId ?? ""]),
    ),
  );
  const [teamSelectionByAward, setTeamSelectionByAward] = useState<Record<string, string>>(
    Object.fromEntries(AWARDS.map((a) => [a.key, data.awards[a.key]?.teamId ?? ""])),
  );
  const [trophyTitleByAward, setTrophyTitleByAward] = useState<Record<string, string>>(
    Object.fromEntries(AWARDS.map((a) => [a.key, data.awards[a.key]?.trophyTitle ?? ""])),
  );
  const [trophyImageByAward, setTrophyImageByAward] = useState<Record<string, string>>(
    Object.fromEntries(AWARDS.map((a) => [a.key, data.awards[a.key]?.trophyImageUrl ?? ""])),
  );
  const [uploadingByAward, setUploadingByAward] = useState<Record<string, boolean>>(
    Object.fromEntries(AWARDS.map((a) => [a.key, false])),
  );

  const uploadTrophyImage = async (awardKey: AwardKey, file: File) => {
    setMessage(null);
    setUploadingByAward((prev) => ({ ...prev, [awardKey]: true }));
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `awards/${data.tournamentId}/${awardKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("tournament-media").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || undefined,
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("tournament-media").getPublicUrl(path);
      setTrophyImageByAward((prev) => ({ ...prev, [awardKey]: publicUrl }));
      setMessage({ type: "success", text: "Trophy image uploaded." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Trophy image upload failed.",
      });
    } finally {
      setUploadingByAward((prev) => ({ ...prev, [awardKey]: false }));
    }
  };

  const saveAward = (awardKey: AwardKey) => {
    setMessage(null);
    startTransition(async () => {
      const isTeamAward = TEAM_AWARD_KEYS.includes(awardKey);
      const playerId = isTeamAward ? null : selectionByAward[awardKey] || null;
      const teamId = isTeamAward ? teamSelectionByAward[awardKey] || null : null;
      const res = await setTournamentAwardAction({
        tournamentId: data.tournamentId,
        awardKey,
        playerId,
        teamId,
        trophyTitle: trophyTitleByAward[awardKey] || null,
        trophyImageUrl: trophyImageByAward[awardKey] || null,
      });
      if (!res.ok) {
        setMessage({ type: "error", text: res.error });
        return;
      }
      setMessage({ type: "success", text: "Tournament award saved." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Tournament Awards</h1>
          <p className="mt-1 text-sm text-slate-400">
            Set tournament-level player achievements manually.
          </p>
        </div>
        <Link
          href={`/organizer/t/${data.tournamentId}/matches`}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Back to matches
        </Link>
      </header>

      {message ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-800 bg-emerald-950/30 text-emerald-200"
              : "border-red-800 bg-red-950/40 text-red-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {AWARDS.map((award) => (
          <div key={award.key} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-sm font-semibold text-slate-100">{award.label}</div>
            <div className="mt-2 grid gap-3">
              {TEAM_AWARD_KEYS.includes(award.key) ? (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Winner team
                  </label>
                  <select
                    value={teamSelectionByAward[award.key] ?? ""}
                    onChange={(e) =>
                      setTeamSelectionByAward((prev) => ({ ...prev, [award.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Not selected</option>
                    {data.teams.map((t) => (
                      <option key={`${award.key}-${t.teamId}`} value={t.teamId}>
                        {t.teamName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400">
                    All players in selected team will get this trophy on profile.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Winner player
                  </label>
                  <select
                    value={selectionByAward[award.key] ?? ""}
                    onChange={(e) =>
                      setSelectionByAward((prev) => ({ ...prev, [award.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Not selected</option>
                    {data.players.map((p) => (
                      <option key={`${award.key}-${p.playerId}`} value={p.playerId}>
                        {p.playerName} ({p.teamName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Trophy title
                </label>
                <input
                  value={trophyTitleByAward[award.key] ?? ""}
                  onChange={(e) =>
                    setTrophyTitleByAward((prev) => ({ ...prev, [award.key]: e.target.value }))
                  }
                  placeholder="Ex: Golden Boot 2025"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Trophy image upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={pending || uploadingByAward[award.key]}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadTrophyImage(award.key, file);
                    e.currentTarget.value = "";
                  }}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700 disabled:opacity-60"
                />
                {uploadingByAward[award.key] ? (
                  <p className="mt-1 text-xs text-slate-400">Uploading trophy image...</p>
                ) : null}
              </div>

              {trophyImageByAward[award.key] ? (
                <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-2">
                  <div className="mb-2 text-[11px] text-slate-400">
                    {trophyTitleByAward[award.key]?.trim() || "Trophy preview"}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trophyImageByAward[award.key]}
                    alt={trophyTitleByAward[award.key]?.trim() || `${award.label} trophy`}
                    className="h-28 w-full rounded-md object-contain bg-slate-900"
                  />
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={pending || uploadingByAward[award.key]}
                onClick={() => saveAward(award.key)}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={pending || uploadingByAward[award.key]}
                onClick={() => {
                  setSelectionByAward((prev) => ({ ...prev, [award.key]: "" }));
                  setTeamSelectionByAward((prev) => ({ ...prev, [award.key]: "" }));
                  setTrophyTitleByAward((prev) => ({ ...prev, [award.key]: "" }));
                  setTrophyImageByAward((prev) => ({ ...prev, [award.key]: "" }));
                  startTransition(async () => {
                    const res = await setTournamentAwardAction({
                      tournamentId: data.tournamentId,
                      awardKey: award.key,
                      playerId: null,
                      teamId: null,
                    });
                    if (!res.ok) {
                      setMessage({ type: "error", text: res.error });
                      return;
                    }
                    setMessage({ type: "success", text: "Tournament award cleared." });
                    router.refresh();
                  });
                }}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
