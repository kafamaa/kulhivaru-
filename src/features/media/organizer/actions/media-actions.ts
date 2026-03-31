"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type CreateAlbumResult = { ok: true; albumId: string } | { ok: false; error: string };
export type UpdateSponsorMetaResult = { ok: true } | { ok: false; error: string };

export async function createAlbumAction(input: {
  tournamentId: string;
  title: string;
}): Promise<CreateAlbumResult> {
  const supabase = await createSupabaseServerClient();

  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("tournament_media_albums")
    .insert({
      tournament_id: input.tournamentId,
      title: input.title,
      slug: slug || null,
      visibility: "public",
      sort_order: 0,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${input.tournamentId}/media`);
  return { ok: true, albumId: String(data.id) };
}

export async function updateSponsorMetaAction(input: {
  tournamentId: string;
  assetId: string;
  sponsorName: string | null;
  sponsorTier: string | null;
}): Promise<UpdateSponsorMetaResult> {
  const supabase = await createSupabaseServerClient();

  if (!input.tournamentId || !input.assetId) {
    return { ok: false, error: "Missing tournament or sponsor asset id." };
  }

  const sponsorName =
    input.sponsorName && input.sponsorName.trim().length > 0
      ? input.sponsorName.trim()
      : null;
  const sponsorTier =
    input.sponsorTier && input.sponsorTier.trim().length > 0
      ? input.sponsorTier.trim()
      : null;

  const { error } = await supabase
    .from("tournament_media_assets")
    .update({
      sponsor_name: sponsorName,
      sponsor_tier: sponsorTier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.assetId)
    .eq("tournament_id", input.tournamentId)
    .in("asset_type", ["sponsor_logo", "sponsor_banner"]);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${input.tournamentId}/media`);
  revalidatePath(`/t/[slug]`, "page");
  return { ok: true };
}
