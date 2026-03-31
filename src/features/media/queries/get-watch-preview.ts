import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface StreamPreviewRow {
  id: string;
  title: string;
  tournamentName: string | null;
  tournamentSlug: string | null;
  isLive: boolean;
  thumbnailUrl: string | null;
  startAt: string | null;
}

export interface HighlightPreviewRow {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: string | null;
  tournamentName: string | null;
}

export async function getLiveStreamPreview(): Promise<StreamPreviewRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_streams")
    .select("id, title, is_live, thumbnail_url, start_at, tournament_name, tournament_slug")
    .eq("is_live", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    tournamentName: data.tournament_name ?? null,
    tournamentSlug: data.tournament_slug ?? null,
    isLive: Boolean(data.is_live),
    thumbnailUrl: data.thumbnail_url ?? null,
    startAt: data.start_at ?? null,
  };
}

export async function getHighlightsPreview(
  limit = 6
): Promise<HighlightPreviewRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_highlights")
    .select("id, title, thumbnail_url, duration, tournament_name")
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    duration: (row.duration as string) ?? null,
    tournamentName: (row.tournament_name as string) ?? null,
  }));
}
