"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { resolveMatchTournamentId } from "@/src/features/matches/organizer/lib/resolve-match-tournament-id";

export type OrganizerMatchEventType =
  | "goal"
  | "own_goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "sub_in"
  | "sub_out"
  | "team_foul"
  | "penalty_free_kick";

export interface OrganizerMatchEventInput {
  eventType: OrganizerMatchEventType;
  minute: number | null;
  playerId: string | null;
  teamId?: string | null;
  periodIndex?: number | null;
  meta?: Record<string, unknown>;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addMatchEventsAction(input: {
  tournamentId: string;
  matchId: string;
  events: OrganizerMatchEventInput[];
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const cleaned = input.events.map((e) => ({
    eventType: e.eventType,
    minute: e.minute ?? null,
    playerId: e.playerId ?? null,
    teamId: e.teamId ?? null,
    periodIndex: e.periodIndex ?? null,
    meta: e.meta ?? {},
  }));

  if (cleaned.length === 0) {
    return { ok: false, error: "No valid events to insert." };
  }

  for (const e of cleaned) {
    const { error } = await supabase.rpc("rpc_add_match_event_rule_aware", {
      p_match_id: input.matchId,
      p_event_type: e.eventType,
      p_player_id: e.playerId,
      p_team_id: e.teamId,
      p_minute: e.minute,
      p_period_index: e.periodIndex,
      p_meta: e.meta,
    });
    if (error) return { ok: false, error: error.message };
  }

  const tid = await resolveMatchTournamentId(supabase, input.matchId, input.tournamentId);
  revalidatePath(`/organizer/match/${input.matchId}`);
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  revalidatePath(`/match/${input.matchId}`);

  return { ok: true };
}

export async function deleteMatchEventAction(input: {
  tournamentId: string;
  matchId: string;
  eventId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("rpc_remove_match_event_rule_aware", {
    p_match_id: input.matchId,
    p_event_id: input.eventId,
  });

  if (error) return { ok: false, error: error.message };

  const tid = await resolveMatchTournamentId(supabase, input.matchId, input.tournamentId);
  revalidatePath(`/organizer/match/${input.matchId}`);
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  revalidatePath(`/match/${input.matchId}`);

  return { ok: true };
}

export async function updateMatchEventMinuteAction(input: {
  tournamentId: string;
  matchId: string;
  eventId: string;
  minute: number;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("rpc_update_match_event_minute", {
    p_match_id: input.matchId,
    p_event_id: input.eventId,
    p_minute: input.minute,
  });

  if (error) return { ok: false, error: error.message };

  const tid = await resolveMatchTournamentId(supabase, input.matchId, input.tournamentId);
  revalidatePath(`/organizer/match/${input.matchId}`);
  revalidatePath(`/organizer/t/${tid}/matches`);
  revalidatePath(`/organizer/t/${tid}`);
  revalidatePath(`/match/${input.matchId}`);

  return { ok: true };
}

