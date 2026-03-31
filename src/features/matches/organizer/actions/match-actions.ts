"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { resolveMatchTournamentId } from "@/src/features/matches/organizer/lib/resolve-match-tournament-id";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type MatchState = "scheduled" | "live" | "paused" | "ft" | "completed";

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
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  revalidatePath(`/t/`); // public pages are slug-based; kept as broad placeholder
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

