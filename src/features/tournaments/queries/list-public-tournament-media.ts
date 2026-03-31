import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type TournamentMediaTypeFilter = "all" | "videos" | "photos" | "live" | "highlights" | "replays";
export type TournamentMediaSort = "featured" | "latest" | "oldest";

export interface TournamentMediaCounts {
  total: number;
  videos: number;
  photos: number; // MVP: always 0 (no photo type in schema yet)
  liveStreams: number;
  highlights: number;
  replays: number;
}

export interface TournamentMediaListItem {
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

export interface TournamentMediaFeaturedPick {
  featuredLarge: TournamentMediaListItem | null;
  supporting: TournamentMediaListItem[];
}

export interface TournamentMediaListResult {
  tournamentSlug: string;
  items: TournamentMediaListItem[];
  total: number;
  page: number;
  limit: number;
  counts: TournamentMediaCounts;
  featured: TournamentMediaFeaturedPick;
}

function mapFilterToWhere(input: TournamentMediaTypeFilter) {
  if (input === "all") return { types: null as Array<"stream" | "highlight" | "vod"> | null, liveOnly: null as boolean | null };
  if (input === "videos") return { types: ["highlight", "vod"] as const, liveOnly: null as boolean | null };
  if (input === "photos") return { types: [] as Array<"stream" | "highlight" | "vod">, liveOnly: null as boolean | null }; // no photos in MVP schema
  if (input === "live") return { types: ["stream"] as const, liveOnly: true as boolean | null };
  if (input === "highlights") return { types: ["highlight"] as const, liveOnly: null as boolean | null };
  if (input === "replays") return { types: ["vod"] as const, liveOnly: null as boolean | null };
  return { types: null, liveOnly: null };
}

function mapSortToOrder(sort: TournamentMediaSort) {
  if (sort === "oldest") {
    return [{ col: "created_at", ascending: true }] as const;
  }
  if (sort === "latest") {
    return [{ col: "created_at", ascending: false }] as const;
  }
  // featured
  return [
    { col: "is_live", ascending: false },
    { col: "created_at", ascending: false },
  ] as const;
}

export async function listPublicTournamentMedia(input: {
  tournamentSlug: string;
  type: TournamentMediaTypeFilter;
  sort: TournamentMediaSort;
  page: number;
  limit: number;
}): Promise<TournamentMediaListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, input.page);
  const limit = Math.max(1, Math.min(24, input.limit));
  const offset = (page - 1) * limit;

  const where = mapFilterToWhere(input.type);

  // Counts (unfiltered)
  const countsAll = await supabase
    .from("public_tournament_media")
    .select("id", { count: "exact" })
    .eq("tournament_slug", input.tournamentSlug);

  const total = countsAll.count ?? 0;

  const [liveCountRes, highlightsCountRes, replaysCountRes, videosCountRes] = await Promise.all([
    supabase
      .from("public_tournament_media")
      .select("id", { count: "exact" })
      .eq("tournament_slug", input.tournamentSlug)
      .eq("is_live", true),
    supabase
      .from("public_tournament_media")
      .select("id", { count: "exact" })
      .eq("tournament_slug", input.tournamentSlug)
      .eq("type", "highlight"),
    supabase
      .from("public_tournament_media")
      .select("id", { count: "exact" })
      .eq("tournament_slug", input.tournamentSlug)
      .eq("type", "vod"),
    supabase
      .from("public_tournament_media")
      .select("id", { count: "exact" })
      .eq("tournament_slug", input.tournamentSlug)
      .in("type", ["highlight", "vod"]),
  ]);

  const counts: TournamentMediaCounts = {
    total,
    videos: videosCountRes.count ?? 0,
    photos: 0,
    liveStreams: liveCountRes.count ?? 0,
    highlights: highlightsCountRes.count ?? 0,
    replays: replaysCountRes.count ?? 0,
  };

  // Main query (filtered + sorted + paginated)
  const query = supabase
    .from("public_tournament_media")
    .select(
      "id, title, type, is_live, thumbnail_url, stream_url, duration, start_at, created_at",
      { count: "exact" }
    )
    .eq("tournament_slug", input.tournamentSlug);

  let q = query;
  if (where.types && where.types.length > 0) {
    q = q.in("type", where.types as any);
  } else if (where.types && where.types.length === 0) {
    // photos -> no rows
    q = q.eq("id", "__no_match__");
  }

  if (where.liveOnly === true) {
    q = q.eq("is_live", true);
  }

  const orders = mapSortToOrder(input.sort);
  for (const o of orders) {
    q = q.order(o.col, { ascending: o.ascending });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error || !data) {
    return {
      tournamentSlug: input.tournamentSlug,
      items: [],
      total: 0,
      page,
      limit,
      counts,
      featured: {
        featuredLarge: null,
        supporting: [],
      },
    };
  }

  const items = (data as any[]).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    type: r.type as TournamentMediaListItem["type"],
    isLive: Boolean(r.is_live),
    thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
    streamUrl: (r.stream_url as string | null) ?? null,
    duration: (r.duration as string | null) ?? null,
    startAt: (r.start_at as string | null) ?? null,
    createdAt: String(r.created_at),
  }));

  const effectiveTotal = count ?? 0;

  // Featured picks from overall (not filtered) using featured sort.
  const featuredRes = await supabase
    .from("public_tournament_media")
    .select(
      "id, title, type, is_live, thumbnail_url, stream_url, duration, start_at, created_at"
    )
    .eq("tournament_slug", input.tournamentSlug)
    .order("is_live", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);

  const featuredItems = (featuredRes.data ?? []).map((r: any) => ({
    id: String(r.id),
    title: String(r.title),
    type: r.type as TournamentMediaListItem["type"],
    isLive: Boolean(r.is_live),
    thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
    streamUrl: (r.stream_url as string | null) ?? null,
    duration: (r.duration as string | null) ?? null,
    startAt: (r.start_at as string | null) ?? null,
    createdAt: String(r.created_at),
  }));

  const live = featuredItems.filter((x) => x.type === "stream" && x.isLive);
  const highlights = featuredItems.filter((x) => x.type === "highlight");
  const vods = featuredItems.filter((x) => x.type === "vod");

  const featuredLarge = live[0] ?? highlights[0] ?? vods[0] ?? featuredItems[0] ?? null;
  const supporting = featuredLarge
    ? featuredItems.filter((x) => x.id !== featuredLarge.id).slice(0, 2)
    : featuredItems.slice(0, 3);

  return {
    tournamentSlug: input.tournamentSlug,
    items,
    total: effectiveTotal,
    page,
    limit,
    counts,
    featured: {
      featuredLarge,
      supporting,
    },
  };
}

