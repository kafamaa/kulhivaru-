"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { resolveMatchTournamentId } from "@/src/features/matches/organizer/lib/resolve-match-tournament-id";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type MatchState = "scheduled" | "live" | "paused" | "ft" | "completed";

async function callGenerateNextKnockoutRound(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tournamentId: string,
  includeThirdPlace: boolean
): Promise<{ error: { message: string } | null }> {
  let { error } = await supabase.rpc("rpc_generate_next_knockout_round", {
    p_tournament_id: tournamentId,
    p_include_third_place: includeThirdPlace,
  });

  if (error && isGenerateKnockoutRpcSignatureError(error.message)) {
    // Fallback for stale schema cache that only exposes p_tournament_id.
    ({ error } = await supabase.rpc("rpc_generate_next_knockout_round", {
      p_tournament_id: tournamentId,
    }));
  }

  if (error && isGenerateKnockoutRpcMissingError(error.message)) {
    return {
      error: {
        message:
          "Knockout generator is not installed in this database yet. Apply migration 20260331212000_knockout_hybrid_progression.sql and reload schema.",
      },
    };
  }

  return { error };
}

export async function updateMatchScheduleAction(input: {
  tournamentId: string;
  matchId: string;
  scheduledAt: string | null; // ISO string or null
  roundLabel?: string | null;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("rpc_update_match_schedule", {
    p_match_id: input.matchId,
    p_scheduled_at: input.scheduledAt,
    p_round_label: input.roundLabel ?? null,
  });

  if (error) return { ok: false, error: error.message };
  const tid = await resolveMatchTournamentId(supabase, input.matchId, input.tournamentId);
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  return { ok: true };
}

export async function updateMatchDetailsAction(input: {
  tournamentId: string;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string | null;
  roundLabel?: string | null;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  let { error } = await supabase.rpc("rpc_update_match_details", {
    p_match_id: input.matchId,
    p_home_team_id: input.homeTeamId,
    p_away_team_id: input.awayTeamId,
    p_scheduled_at: input.scheduledAt,
    p_round_label: input.roundLabel ?? null,
  });

  if (error && isUpdateMatchDetailsRpcMissingError(error.message)) {
    // Backward-compatible fallback: update schedule via RPC and teams via table update.
    const scheduleRes = await updateMatchScheduleAction({
      tournamentId: input.tournamentId,
      matchId: input.matchId,
      scheduledAt: input.scheduledAt,
      roundLabel: input.roundLabel ?? null,
    });
    if (!scheduleRes.ok) return scheduleRes;
    const teamUpdate = await supabase
      .from("matches")
      .update({
        home_team_id: input.homeTeamId,
        away_team_id: input.awayTeamId,
      })
      .eq("id", input.matchId);
    if (teamUpdate.error) return { ok: false, error: teamUpdate.error.message };
    revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
    revalidatePath(`/organizer/t/${input.tournamentId}`);
    return { ok: true };
  }

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  return { ok: true };
}

export async function updateMatchResultAction(input: {
  tournamentId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: "ft" | "completed";
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const args = {
    p_match_id: input.matchId,
    p_home_score: input.homeScore,
    p_away_score: input.awayScore,
    p_status: input.status,
  };

  let { error } = await supabase.rpc("rpc_finalize_match_rule_aware_v3", args);
  if (error && isFinalizeRpcMissingError(error.message)) {
    ({ error } = await supabase.rpc("rpc_finalize_match_rule_aware_v2", args));
  }
  if (error && isFinalizeRpcMissingError(error.message)) {
    ({ error } = await supabase.rpc("rpc_finalize_match_rule_aware", args));
  }

  if (error) return { ok: false, error: error.message };

  const tid = await resolveMatchTournamentId(supabase, input.matchId, input.tournamentId);
  const championRes = await setChampionIfFinalMatch(supabase, input.matchId, tid);
  if (!championRes.ok) return championRes;
  // Hybrid knockout flow: whenever a match is finalized, try to create/fill next round slots.
  const knockoutRes = await callGenerateNextKnockoutRound(supabase, tid, true);
  // Do not block finalization if knockout generator is not installed yet.
  if (
    knockoutRes.error &&
    !isGenerateKnockoutRpcMissingError(knockoutRes.error.message)
  ) {
    return { ok: false, error: knockoutRes.error.message };
  }
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  revalidatePath(`/t/`); // public pages are slug-based; kept as broad placeholder
  return { ok: true };
}

async function setChampionIfFinalMatch(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  matchId: string,
  tournamentId: string,
): Promise<ActionResult> {
  const { data: matchRow, error } = await supabase
    .from("matches")
    .select("slot_code,round_label,home_team_id,away_team_id,home_score,away_score,status")
    .eq("id", matchId)
    .single();
  if (error || !matchRow) return { ok: true };

  const slotCode = String((matchRow as any).slot_code ?? "").toUpperCase();
  const roundLabel = String((matchRow as any).round_label ?? "").trim().toLowerCase();
  const isFinal = slotCode === "F1" || roundLabel === "final" || roundLabel === "grand final";
  if (!isFinal) return { ok: true };

  const homeScore = Number((matchRow as any).home_score ?? 0);
  const awayScore = Number((matchRow as any).away_score ?? 0);
  const homeTeamId = (matchRow as any).home_team_id ? String((matchRow as any).home_team_id) : null;
  const awayTeamId = (matchRow as any).away_team_id ? String((matchRow as any).away_team_id) : null;
  const status = String((matchRow as any).status ?? "");

  if (!["ft", "completed"].includes(status)) return { ok: true };
  if (!homeTeamId || !awayTeamId) return { ok: true };
  if (homeScore === awayScore) return { ok: true };

  const winnerTeamId = homeScore > awayScore ? homeTeamId : awayTeamId;
  let { error: championError } = await supabase.rpc("rpc_set_tournament_champion", {
    p_tournament_id: tournamentId,
    p_team_id: winnerTeamId,
  });

  if (championError && isSetChampionRpcMissingError(championError.message)) {
    const fallback = await supabase
      .from("tournaments")
      .update({ champion_team_id: winnerTeamId })
      .eq("id", tournamentId);
    championError = fallback.error as any;
  }

  if (championError) return { ok: false, error: championError.message };
  return { ok: true };
}

function isFinalizeRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_finalize_match_rule_aware_v3") ||
    lower.includes("could not find the function public.rpc_finalize_match_rule_aware_v2") ||
    lower.includes("schema cache")
  );
}

export async function updateMatchLiveAction(input: {
  tournamentId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  liveMinute: number | null;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("rpc_update_match_live_score", {
    p_match_id: input.matchId,
    p_home_score: input.homeScore,
    p_away_score: input.awayScore,
    p_live_minute: input.liveMinute,
  });

  if (error) return { ok: false, error: error.message };

  const tid = await resolveMatchTournamentId(supabase, input.matchId, input.tournamentId);
  revalidatePath(`/organizer/match/${input.matchId}`);
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  revalidatePath(`/match/${input.matchId}`);

  return { ok: true };
}

export async function updateMatchStateAction(input: {
  tournamentId: string;
  matchId: string;
  status: MatchState;
  liveMinute?: number | null;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const args = {
    p_match_id: input.matchId,
    p_status: input.status,
    // Keep this always numeric to avoid PostgREST signature resolution issues with NULL.
    p_live_minute: input.liveMinute ?? 0,
  };

  // Prefer a non-overloaded RPC name to avoid schema-cache signature ambiguity.
  let { error } = await supabase.rpc("rpc_update_match_state_v2", args);
  if (error && isRpcMissingError(error.message)) {
    ({ error } = await supabase.rpc("rpc_update_match_state", args));
  }

  if (error) return { ok: false, error: error.message };

  const tid = await resolveMatchTournamentId(supabase, input.matchId, input.tournamentId);
  revalidatePath(`/organizer/match/${input.matchId}`);
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  revalidatePath(`/match/${input.matchId}`);
  return { ok: true };
}

function isRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_update_match_state_v2") ||
    lower.includes("schema cache")
  );
}

export async function generateRoundRobinFixturesAction(input: {
  tournamentId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  // Prevent generating on top of existing matches
  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", input.tournamentId)
    .limit(1);

  if ((existing ?? []).length > 0) {
    return { ok: false, error: "Matches already exist for this tournament." };
  }

  const { data: entries, error: eError } = await supabase
    .from("team_entries")
    .select("team_id, status")
    .eq("tournament_id", input.tournamentId)
    .eq("status", "approved");

  if (eError) return { ok: false, error: eError.message };

  const teamIds = (entries ?? []).map((e: any) => String(e.team_id));
  if (teamIds.length < 2) {
    return { ok: false, error: "Need at least 2 approved teams to generate fixtures." };
  }

  const fixtures = roundRobin(teamIds).map((f) => ({
    tournament_id: input.tournamentId,
    home_team_id: f.homeTeamId,
    away_team_id: f.awayTeamId,
    status: "scheduled" as const,
    round_label: f.roundLabel,
    scheduled_at: null as string | null,
    home_score: 0,
    away_score: 0,
  }));

  const { error: insertError } = await supabase.from("matches").insert(fixtures);
  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  return { ok: true };
}

export async function createManualFixtureAction(input: {
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  roundLabel?: string | null;
  scheduledAt?: string | null;
}): Promise<ActionResult> {
  if (!input.homeTeamId || !input.awayTeamId) {
    return { ok: false, error: "Select both home and away teams." };
  }
  if (input.homeTeamId === input.awayTeamId) {
    return { ok: false, error: "Home and away teams must be different." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("rpc_create_manual_fixture", {
    p_tournament_id: input.tournamentId,
    p_home_team_id: input.homeTeamId,
    p_away_team_id: input.awayTeamId,
    p_round_label: input.roundLabel ?? null,
    p_scheduled_at: input.scheduledAt ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${input.tournamentId}/structure`);
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  return { ok: true };
}

export async function generateNextKnockoutRoundAction(input: {
  tournamentId: string;
  includeThirdPlace?: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await callGenerateNextKnockoutRound(
    supabase,
    input.tournamentId,
    input.includeThirdPlace ?? true,
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  return { ok: true };
}

function isGenerateKnockoutRpcSignatureError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_generate_next_knockout_round") ||
    lower.includes("schema cache")
  );
}

function isGenerateKnockoutRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("could not find the function public.rpc_generate_next_knockout_round");
}

export async function createManualKnockoutMatchAction(input: {
  tournamentId: string;
  slotCode: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  scheduledAt?: string | null;
  venue?: string | null;
  notes?: string | null;
  homeSource?: string | null;
  awaySource?: string | null;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await callCreateManualKnockoutMatch(supabase, {
    p_tournament_id: input.tournamentId,
    p_slot_code: input.slotCode,
    p_home_team_id: input.homeTeamId ?? null,
    p_away_team_id: input.awayTeamId ?? null,
    p_scheduled_at: input.scheduledAt ?? null,
    p_venue: input.venue ?? null,
    p_notes: input.notes ?? null,
    p_home_source: input.homeSource ?? null,
    p_away_source: input.awaySource ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  return { ok: true };
}

export async function createKnockoutShellFromStandingsAction(input: {
  tournamentId: string;
  knockoutStartRound: "QF" | "SF" | "F";
  includeThirdPlace?: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const createOne = async (args: {
    slotCode: string;
    homeSource: string;
    awaySource: string;
    roundLabel: string;
  }) => {
    const { error } = await callCreateManualKnockoutMatch(supabase, {
      p_tournament_id: input.tournamentId,
      p_slot_code: args.slotCode,
      p_home_team_id: null,
      p_away_team_id: null,
      p_scheduled_at: null,
      p_venue: null,
      p_notes: `Shell from standings (${args.homeSource} vs ${args.awaySource})`,
      p_home_source: args.homeSource,
      p_away_source: args.awaySource,
    });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  };

  if (input.knockoutStartRound === "QF") {
    const tasks = [
      { slotCode: "QF1", homeSource: "standing:1", awaySource: "standing:8", roundLabel: "Quarter Final" },
      { slotCode: "QF2", homeSource: "standing:4", awaySource: "standing:5", roundLabel: "Quarter Final" },
      { slotCode: "QF3", homeSource: "standing:2", awaySource: "standing:7", roundLabel: "Quarter Final" },
      { slotCode: "QF4", homeSource: "standing:3", awaySource: "standing:6", roundLabel: "Quarter Final" },
    ];
    for (const task of tasks) {
      const res = await createOne(task);
      if (!res.ok) return res;
    }
  } else if (input.knockoutStartRound === "SF") {
    const tasks = [
      { slotCode: "SF1", homeSource: "standing:1", awaySource: "standing:4", roundLabel: "Semi Final" },
      { slotCode: "SF2", homeSource: "standing:2", awaySource: "standing:3", roundLabel: "Semi Final" },
    ];
    for (const task of tasks) {
      const res = await createOne(task);
      if (!res.ok) return res;
    }
  } else {
    const res = await createOne({
      slotCode: "F1",
      homeSource: "standing:1",
      awaySource: "standing:2",
      roundLabel: "Final",
    });
    if (!res.ok) return res;
  }

  if (input.includeThirdPlace && input.knockoutStartRound !== "F") {
    const { error } = await callCreateManualKnockoutMatch(supabase, {
      p_tournament_id: input.tournamentId,
      p_slot_code: "TP1",
      p_home_team_id: null,
      p_away_team_id: null,
      p_scheduled_at: null,
      p_venue: null,
      p_notes: "Third place shell",
      p_home_source: "loser:SF1",
      p_away_source: "loser:SF2",
    });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath(`/organizer/t/${input.tournamentId}/knockout-setup`);
  revalidatePath(`/organizer/t/${input.tournamentId}/knockout`);
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  return { ok: true };
}

export async function deleteMatchAction(input: {
  tournamentId: string;
  matchId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  // Prefer RPC path when available.
  let { error } = await supabase.rpc("rpc_delete_match", {
    p_match_id: input.matchId,
  });
  if (error && isDeleteMatchRpcMissingError(error.message)) {
    // Backward-compatible fallback for databases without rpc_delete_match.
    const fallback = await supabase
      .from("matches")
      .delete()
      .eq("id", input.matchId)
      .select("id");
    error = fallback.error;
    if (!error && (fallback.data ?? []).length === 0) {
      return {
        ok: false,
        error:
          "Delete was blocked or no row was removed. Apply rpc_delete_match migration or check match delete permissions.",
      };
    }
  }

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  return { ok: true };
}

export async function setMatchAwardAction(input: {
  tournamentId: string;
  matchId: string;
  playerId: string;
  awardType?: "man_of_the_match";
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  let { error } = await supabase.rpc("rpc_set_match_award", {
    p_match_id: input.matchId,
    p_player_id: input.playerId,
    p_award_type: input.awardType ?? "man_of_the_match",
  });
  if (error && isSetMatchAwardRpcMissingError(error.message)) {
    return {
      ok: false,
      error:
        "Match awards RPC is not installed in this database yet. Apply migration 20260331234500_match_awards_and_player_achievements.sql and reload schema.",
    };
  }
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/match/${input.matchId}`);
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  revalidatePath(`/player/${input.playerId}`);
  return { ok: true };
}

async function callCreateManualKnockoutMatch(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  args: {
    p_tournament_id: string;
    p_slot_code: string;
    p_home_team_id: string | null;
    p_away_team_id: string | null;
    p_scheduled_at: string | null;
    p_venue: string | null;
    p_notes: string | null;
    p_home_source: string | null;
    p_away_source: string | null;
  },
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.rpc("rpc_create_manual_knockout_match", args);
  if (error && isCreateManualKnockoutRpcMissingError(error.message)) {
    return {
      error: {
        message:
          "Knockout manual RPC is not installed in this database yet. Apply migration 20260331212000_knockout_hybrid_progression.sql and reload schema.",
      },
    };
  }
  return { error };
}

function isCreateManualKnockoutRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_create_manual_knockout_match") ||
    lower.includes("schema cache")
  );
}

function isDeleteMatchRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_delete_match") ||
    lower.includes("schema cache")
  );
}

function isUpdateMatchDetailsRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_update_match_details") ||
    lower.includes("schema cache")
  );
}

function isSetMatchAwardRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_set_match_award") ||
    lower.includes("schema cache")
  );
}

function isSetChampionRpcMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_set_tournament_champion") ||
    lower.includes("schema cache")
  );
}

function roundRobin(teamIds: string[]): { roundLabel: string; homeTeamId: string; awayTeamId: string }[] {
  // Circle method
  const ids = [...teamIds];
  const isOdd = ids.length % 2 === 1;
  if (isOdd) ids.push("BYE");

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;
  const schedule: { roundLabel: string; homeTeamId: string; awayTeamId: string }[] = [];

  let arr = [...ids];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === "BYE" || b === "BYE") continue;
      const home = r % 2 === 0 ? a : b;
      const away = r % 2 === 0 ? b : a;
      schedule.push({ roundLabel: `Round ${r + 1}`, homeTeamId: home, awayTeamId: away });
    }
    // rotate (keep first fixed)
    arr = [arr[0], ...arr.slice(n - 1), ...arr.slice(1, n - 1)];
  }
  return schedule;
}

