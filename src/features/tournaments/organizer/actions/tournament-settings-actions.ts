"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import {
  tournamentSettingsSchema,
  type TournamentSettingsFormValues,
} from "@/src/features/tournaments/organizer/schemas/tournament-settings-schema";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function updateTournamentSettingsAction(input: {
  tournamentId: string;
  values: TournamentSettingsFormValues;
}): Promise<ActionResult> {
  const parsed = tournamentSettingsSchema.safeParse(input.values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Validation error", fieldErrors };
  }

  const v = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("tournaments")
    .update({
      name: v.name,
      sport: v.sport,
      location: v.location ?? null,
      start_date: v.startDate ?? null,
      end_date: v.endDate ?? null,
      cover_image_url: v.coverImageUrl ?? null,
      logo_url: v.logoUrl ?? null,
      status: v.status,
      is_registration_open: v.isRegistrationOpen,
    })
    .eq("id", input.tournamentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${input.tournamentId}/settings`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  revalidatePath(`/t/`);
  return { ok: true };
}

export async function archiveTournamentAction(input: {
  tournamentId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("tournaments")
    .update({ status: "archived" })
    .eq("id", input.tournamentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${input.tournamentId}/settings`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);
  revalidatePath(`/organizer/tournaments`);
  revalidatePath(`/t/`);
  return { ok: true };
}

