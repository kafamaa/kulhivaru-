"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/src/features/teams/lib/slugify";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createTeamAction(input: {
  name: string;
  slug?: string;
  logoUrl?: string | null;
}): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  const supabase = await createSupabaseServerClient();
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Team name is required" };

  const slug = (input.slug?.trim() || slugify(name)).toLowerCase();
  const logo_url = input.logoUrl ?? null;

  const { data, error } = await supabase
    .from("teams")
    .insert({ name, slug, logo_url })
    .select("id, name, slug")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create team" };

  // Revalidate common surfaces
  revalidatePath("/organizer");
  revalidatePath("/organizer/tournaments");
  return { ok: true, data: { id: data.id, name: data.name, slug: data.slug } };
}

export async function updateTeamLogoAction(input: {
  teamId: string;
  logoUrl: string | null;
}): Promise<ActionResult<{ id: string; logoUrl: string | null }>> {
  const supabase = await createSupabaseServerClient();

  const logo_url = input.logoUrl ?? null;

  const { data, error } = await supabase
    .from("teams")
    .update({ logo_url })
    .eq("id", input.teamId)
    .select("id, logo_url")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update team logo",
    };
  }

  revalidatePath(`/organizer/team/${input.teamId}`);
  revalidatePath(`/team/${input.teamId}`);

  return {
    ok: true,
    data: { id: String(data.id), logoUrl: (data.logo_url as string | null) ?? null },
  };
}

