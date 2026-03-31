import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type WatchMediaType = "all" | "live" | "highlight" | "replay";
export type WatchMediaGridItemType = "live" | "highlight" | "replay";

export interface WatchTournamentOption {
  slug: string;
  name: string;
  sport: string;
}

export interface WatchGridItem {
  id: string;
  type: WatchMediaGridItemType;
  title: string;
  thumbnailUrl: string | null;
  duration: string | null;
  isLive: boolean;
  startAt: string | null;
  tournamentName: string | null;
  tournamentSlug: string | null;
}

export interface ListPublicWatchMediaInput {
  type: WatchMediaType;
  tournamentSlug?: string | null;
  date?: string | null; // YYYY-MM-DD (optional)
  limit: number;
  offset: number;
}

export interface ListPublicWatchMediaResult {
  items: WatchGridItem[];
  total: number | null;
  limit: number;
  offset: number;
  error?: string;
}

function resolveGridType(type: WatchMediaType): WatchMediaGridItemType | null {
  if (type === "live") return "live";
  if (type === "highlight") return "highlight";
  if (type === "replay") return "replay";
  return null;
}

function mediaTypeToDbType(t: WatchGridItem["type"]): "stream" | "highlight" | "vod" {
  if (t === "live") return "stream";
  if (t === "highlight") return "highlight";
  return "vod";
}

export async function listPublicWatchTournamentOptions(input?: {
  sport?: string;
  limit?: number;
}): Promise<WatchTournamentOption[]> {
  const supabase = await createSupabaseServerClient();
  const limit = input?.limit ?? 50;

  const query = supabase
    .from("public_tournaments")
    .select("slug,name,sport")
    .order("start_date", { ascending: false })
    .limit(limit);

  const { data, error } = input?.sport && input.sport !== "all"
    ? await query.eq("sport", input.sport)
    : await query;

  if (error || !data) return [];

  return (data as any[]).map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    sport: String(r.sport ?? ""),
  }));
}

export async function listPublicLiveStreams(input: {
  tournamentSlug?: string | null;
  limit: number;
}): Promise<WatchGridItem[]> {
  const supabase = await createSupabaseServerClient();

  const publicTournamentStatuses = ["upcoming", "ongoing", "completed"];

  let tournamentIds: string[] | null = null;
  if (input.tournamentSlug) {
    const { data: tData, error: tErr } = await supabase
      .from("tournaments")
      .select("id")
      .eq("slug", input.tournamentSlug)
      .in("status", publicTournamentStatuses);

    if (!tErr && tData) {
      tournamentIds = tData.map((r: any) => String(r.id));
    }
  }

  if (!tournamentIds) {
    const { data: tData } = await supabase
      .from("tournaments")
      .select("id")
      .in("status", publicTournamentStatuses);
    tournamentIds = (tData ?? []).map((r: any) => String(r.id));
  }

  let query = supabase
    .from("media_assets")
    .select(
      "id,title,type,is_live,thumbnail_url,duration,start_at,created_at, tournaments(slug,name)"
    )
    .eq("type", "stream")
    .eq("is_live", true)
    .order("created_at", { ascending: false })
    .limit(input.limit);

  if (tournamentIds && tournamentIds.length > 0) {
    query = query.in("tournament_id", tournamentIds);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as any[]).map((r) => ({
    id: String(r.id),
    type: "live",
    title: String(r.title),
    thumbnailUrl: (r.thumbnail_url as string) ?? null,
    duration: (r.duration as string) ?? null,
    isLive: Boolean(r.is_live),
    startAt: r.start_at ? String(r.start_at) : null,
    tournamentName: r.tournaments?.name ? String(r.tournaments.name) : null,
    tournamentSlug: r.tournaments?.slug ? String(r.tournaments.slug) : null,
  }));
}

export async function listPublicWatchMedia(input: ListPublicWatchMediaInput): Promise<ListPublicWatchMediaResult> {
  const supabase = await createSupabaseServerClient();

  const publicTournamentStatuses = ["upcoming", "ongoing", "completed"];

  const limit = Math.max(1, Math.min(30, input.limit));
  const offset = Math.max(0, input.offset);

  // Resolve tournament slug to tournament_id list for filtering.
  let tournamentIds: string[] | null = null;
  if (input.tournamentSlug) {
    const { data: tData, error: tErr } = await supabase
      .from("tournaments")
      .select("id")
      .eq("slug", input.tournamentSlug)
      .in("status", publicTournamentStatuses);

    if (!tErr && tData) {
      tournamentIds = tData.map((r: any) => String(r.id));
    }
  }

  if (!tournamentIds) {
    const { data: tData } = await supabase
      .from("tournaments")
      .select("id")
      .in("status", publicTournamentStatuses);
    tournamentIds = (tData ?? []).map((r: any) => String(r.id));
  }

  const requestedType = resolveGridType(input.type);

  let dbTypeFilter:
    | { type: "stream"; isLive: boolean }
    | { type: "highlight" }
    | { type: "vod" }
    | null = null;

  if (requestedType) {
    const dbType = mediaTypeToDbType(requestedType);
    if (dbType === "stream") {
      dbTypeFilter = { type: "stream", isLive: true };
    } else {
      dbTypeFilter = { type: dbType };
    }
  }

  let query = supabase
    .from("media_assets")
    .select(
      "id,title,type,is_live,thumbnail_url,duration,start_at,created_at, tournaments(slug,name)",
      { count: "exact" }
    )
    .range(offset, offset + limit - 1);

  if (dbTypeFilter) {
    if ("isLive" in dbTypeFilter) {
      query = query
        .eq("type", dbTypeFilter.type)
        .eq("is_live", dbTypeFilter.isLive);
    } else {
      query = query.eq("type", dbTypeFilter.type);
    }
  } else {
    // type=all => streams (live + scheduled), highlights, vod
    query = query.in("type", ["stream", "highlight", "vod"]);
  }

  if (tournamentIds && tournamentIds.length > 0) {
    query = query.in("tournament_id", tournamentIds);
  }

  if (input.date && input.date.trim()) {
    // Simple best-effort: filter by created_at day for all media types.
    const start = new Date(`${input.date}T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) {
      const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      query = query.gte("created_at", start.toISOString()).lt(
        "created_at",
        endExclusive.toISOString()
      );
    }
  }

  // Ordering
  if (input.type === "live") {
    query = query.order("created_at", { ascending: false });
  } else if (input.type === "highlight" || input.type === "replay") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("is_live", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) {
    return { items: [], total: null, limit, offset, error: error.message };
  }

  const items: WatchGridItem[] = (data ?? []).map((r: any) => {
    const t = String(r.type) as "stream" | "highlight" | "vod";
    const type: WatchGridItemType =
      t === "stream" ? "live" : t === "highlight" ? "highlight" : "replay";

    return {
      id: String(r.id),
      type,
      title: String(r.title),
      thumbnailUrl: (r.thumbnail_url as string) ?? null,
      duration: (r.duration as string) ?? null,
      isLive: Boolean(r.is_live),
      startAt: r.start_at ? String(r.start_at) : null,
      tournamentName: r.tournaments?.name ? String(r.tournaments.name) : null,
      tournamentSlug: r.tournaments?.slug ? String(r.tournaments.slug) : null,
    };
  });

  return {
    items,
    total: typeof count === "number" ? count : null,
    limit,
    offset,
  };
}

export interface PublicWatchMediaDetail {
  id: string;
  type: WatchGridItemType;
  title: string;
  thumbnailUrl: string | null;
  duration: string | null;
  isLive: boolean;
  startAt: string | null;
  streamUrl: string | null;
  tournamentName: string | null;
  tournamentSlug: string | null;
}

export async function getPublicWatchMediaDetail(input: { mediaId: string }): Promise<PublicWatchMediaDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("media_assets")
    .select(
      "id,type,title,thumbnail_url,duration,is_live,start_at,stream_url, tournaments(slug,name)"
    )
    .eq("id", input.mediaId)
    .single();

  if (error || !data) return null;

  const dbType = String(data.type) as "stream" | "highlight" | "vod";
  const type: WatchGridItemType =
    dbType === "stream" ? "live" : dbType === "highlight" ? "highlight" : "replay";

  return {
    id: String(data.id),
    type,
    title: String(data.title),
    thumbnailUrl: (data.thumbnail_url as string) ?? null,
    duration: (data.duration as string) ?? null,
    isLive: Boolean(data.is_live),
    startAt: data.start_at ? String(data.start_at) : null,
    streamUrl: (data.stream_url as string) ?? null,
    tournamentName: data.tournaments?.name ? String(data.tournaments.name) : null,
    tournamentSlug: data.tournaments?.slug ? String(data.tournaments.slug) : null,
  };
}

