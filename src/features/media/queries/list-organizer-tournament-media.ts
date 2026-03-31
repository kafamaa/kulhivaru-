import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type OrganizerTournamentMediaType = "stream" | "highlight" | "vod";

export interface OrganizerTournamentMediaItem {
  id: string;
  title: string;
  type: OrganizerTournamentMediaType;
  isLive: boolean;
  thumbnailUrl: string | null;
  streamUrl: string | null;
  duration: string | null;
  startAt: string | null;
  createdAt: string;
}

export async function listOrganizerTournamentMedia(input: {
  tournamentId: string;
}): Promise<OrganizerTournamentMediaItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("media_assets")
    .select(
      "id, title, type, is_live, thumbnail_url, stream_url, duration, start_at, created_at"
    )
    .eq("tournament_id", input.tournamentId)
    .order("is_live", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    type: String(r.type) as OrganizerTournamentMediaType,
    isLive: Boolean(r.is_live),
    thumbnailUrl: (r.thumbnail_url as string) ?? null,
    streamUrl: (r.stream_url as string) ?? null,
    duration: (r.duration as string) ?? null,
    startAt: r.start_at ? String(r.start_at) : null,
    createdAt: String(r.created_at),
  }));
}

