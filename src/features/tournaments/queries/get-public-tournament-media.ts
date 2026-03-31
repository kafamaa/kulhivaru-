import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicTournamentMediaItem {
  id: string;
  title: string;
  type: "stream" | "highlight" | "vod";
  isLive: boolean;
  thumbnailUrl: string | null;
  streamUrl: string | null;
  duration: string | null;
  startAt: string | null;
  createdAt: string;
}

export async function getPublicTournamentMedia(
  tournamentSlug: string
): Promise<PublicTournamentMediaItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_tournament_media")
    .select("id, title, type, is_live, thumbnail_url, stream_url, duration, start_at, created_at")
    .eq("tournament_slug", tournamentSlug)
    .order("is_live", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    type: r.type as PublicTournamentMediaItem["type"],
    isLive: Boolean(r.is_live),
    thumbnailUrl: (r.thumbnail_url as string) ?? null,
    streamUrl: (r.stream_url as string) ?? null,
    duration: (r.duration as string) ?? null,
    startAt: (r.start_at as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

