"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type ActionResult =
  | { ok: true; rowsUpserted: number }
  | { ok: false; error: string };

export async function recomputeStandingsCacheAction(input: {
  tournamentId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("rpc_recompute_standings_cache", {
    p_tournament_id: input.tournamentId,
  });

  if (error) return { ok: false, error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  const rowsUpserted = row?.rows_upserted != null ? Number(row.rows_upserted) : 0;

  revalidatePath(`/organizer/t/${input.tournamentId}/standings`);
  revalidatePath(`/organizer/t/${input.tournamentId}`);

  // Revalidate public standings page (slug-based)
  const { data: t } = await supabase
    .from("tournaments")
    .select("slug")
    .eq("id", input.tournamentId)
    .single();
  if (t?.slug) {
    revalidatePath(`/t/${t.slug}/standings`);
    revalidatePath(`/t/${t.slug}`);
  }

  return { ok: true, rowsUpserted };
}

