"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type TournamentAwardsActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setTournamentAwardAction(input: {
  tournamentId: string;
  awardKey:
    | "mvp"
    | "best_goalkeeper"
    | "best_defender"
    | "young_player"
    | "top_scorer"
    | "best_assist_provider"
    | "champion_trophy"
    | "runner_up_trophy";
  playerId: string | null;
  teamId?: string | null;
  trophyTitle?: string | null;
  trophyImageUrl?: string | null;
}): Promise<TournamentAwardsActionResult> {
  const supabase = await createSupabaseServerClient();

  const callWithTrophy = await supabase.rpc("rpc_set_tournament_award", {
    p_tournament_id: input.tournamentId,
    p_award_key: input.awardKey,
    p_player_id: input.playerId,
    p_trophy_title: input.trophyTitle ?? null,
    p_trophy_image_url: input.trophyImageUrl ?? null,
    p_team_id: input.teamId ?? null,
  });

  if (callWithTrophy.error) {
    const msg = callWithTrophy.error.message.toLowerCase();
    const isMissingRpc =
      msg.includes("could not find the function public.rpc_set_tournament_award") ||
      msg.includes("schema cache");

    if (isMissingRpc) {
      const wantsTrophyMetadata = Boolean(
        (input.trophyTitle && input.trophyTitle.trim()) ||
          (input.trophyImageUrl && input.trophyImageUrl.trim()),
      );
      const wantsTeamAward = Boolean(input.teamId);
      if (wantsTrophyMetadata) {
        return {
          ok: false,
          error:
            "Trophy title/image support is not installed yet. Apply migration 20260331241000_tournament_awards_trophy_fields.sql and reload schema, then save again.",
        };
      }
      if (wantsTeamAward) {
        return {
          ok: false,
          error:
            "Team-based champion/runner-up awards are not installed yet. Apply migration 20260331243000_team_based_champion_runnerup_awards.sql and reload schema, then save again.",
        };
      }

      // Backward compatibility: retry old 3-arg RPC signature if trophy fields migration is not yet applied.
      const callLegacy = await supabase.rpc("rpc_set_tournament_award", {
        p_tournament_id: input.tournamentId,
        p_award_key: input.awardKey,
        p_player_id: input.playerId,
      });

      if (!callLegacy.error) {
        revalidatePath(`/organizer/t/${input.tournamentId}/awards`);
        revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
        return { ok: true };
      }

      const legacyMsg = callLegacy.error.message.toLowerCase();
      const legacyMissingRpc =
        legacyMsg.includes("could not find the function public.rpc_set_tournament_award") ||
        legacyMsg.includes("schema cache");
      if (legacyMissingRpc) {
        return {
          ok: false,
          error:
            "Tournament awards RPC is not installed yet. Apply migrations 20260331240000_tournament_awards_manual.sql, 20260331241000_tournament_awards_trophy_fields.sql, and 20260331243000_team_based_champion_runnerup_awards.sql, then reload schema.",
        };
      }

      return { ok: false, error: callLegacy.error.message };
    }

    return { ok: false, error: callWithTrophy.error.message };
  }

  revalidatePath(`/organizer/t/${input.tournamentId}/awards`);
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  return { ok: true };
}
