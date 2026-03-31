import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type MatchCenterTab = "live" | "today" | "results" | "upcoming";
export type MatchCenterView = "grid" | "list";
export type MatchCenterStatusFilter = "all" | "live" | "scheduled" | "completed";

export interface PublicMatchTeam {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
}

export interface PublicMatchCenterItem {
  id: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  location: string | null;

  status: string;
  statusLabel: string;
  scoreText: string | null;

  scheduledAt: string | null;
  roundLabel: string | null;
  liveMinute: number | null;

  home: PublicMatchTeam | null;
  away: PublicMatchTeam | null;
}

export interface MatchCenterFilters {
  tab: MatchCenterTab;
  date: string; // 'today' | 'tomorrow' | 'yesterday' | 'YYYY-MM-DD'
  tournament?: string; // tournament slug
  sport?: string; // tournament sport value
  status?: MatchCenterStatusFilter;
}

export interface ListPublicMatchesCenterResult {
  items: PublicMatchCenterItem[];
  total: number | null;
  limit: number;
  offset: number;
  error?: string;
  // Useful for UI (optional)
  effectiveDateLabel: string;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatUtcTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

function parseDateParamToRange(dateParam: string): {
  start: Date;
  endExclusive: Date;
  label: string;
} {
  const now = new Date();

  if (dateParam === "today" || !dateParam) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, endExclusive, label: "Today" };
  }

  if (dateParam === "tomorrow") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, endExclusive, label: "Tomorrow" };
  }

  if (dateParam === "yesterday") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, endExclusive, label: "Yesterday" };
  }

  // Custom: YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const start = new Date(Date.UTC(year, month - 1, day));
    const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, endExclusive, label: "Custom" };
  }

  // Fallback
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, endExclusive, label: "Today" };
}

function computeStatusLabel(input: {
  status: string;
  liveMinute: number | null;
  scheduledAt: string | null;
  scoreText: string | null;
  dateLabel: string;
}) {
  if (input.status === "live") {
    if (input.liveMinute != null) return `Live ${input.liveMinute}'`;
    return "Live";
  }

  if (input.status === "ft" || input.status === "completed") {
    return `FT ${input.scoreText ?? "—"}`;
  }

  if (input.status === "scheduled") {
    if (!input.scheduledAt) return "Scheduled";
    return `${input.dateLabel} ${formatUtcTime(input.scheduledAt)}`;
  }

  if (input.status === "postponed") return "Postponed";
  if (input.status === "cancelled") return "Cancelled";
  return input.scheduledAt ? `${formatUtcTime(input.scheduledAt)}` : input.status;
}

export async function listPublicMatchesCenter(input: {
  filters: MatchCenterFilters;
  limit: number;
  offset: number;
}): Promise<ListPublicMatchesCenterResult> {
  const supabase = await createSupabaseServerClient();

  const limit = Math.max(1, Math.min(30, input.limit));
  const offset = Math.max(0, input.offset);

  const { start, endExclusive, label: effectiveDateLabel } =
    parseDateParamToRange(input.filters.date);

  // Date range only matters for tabs that represent day feeds.
  const applyDateRange = input.filters.tab !== "live" || Boolean(input.filters.date);

  const statusFilter: MatchCenterStatusFilter =
    input.filters.status ?? "all";

  let statusSet: string[] | null = null;
  if (statusFilter === "live") statusSet = ["live"];
  else if (statusFilter === "completed") statusSet = ["ft", "completed"];
  else if (statusFilter === "scheduled") statusSet = ["scheduled"];

  if (statusSet == null) {
    // Derive from tab.
    if (input.filters.tab === "live") statusSet = ["live"];
    else if (input.filters.tab === "results") statusSet = ["ft", "completed"];
    else if (input.filters.tab === "upcoming") statusSet = ["scheduled"];
    else statusSet = ["live", "scheduled", "ft", "completed"];
  }

  // Optional tournament filter: resolve tournament slugs -> IDs.
  let tournamentIds: string[] | null = null;
  if (input.filters.tournament && input.filters.tournament.trim()) {
    const slug = input.filters.tournament.trim();
    const { data, error } = await supabase
      .from("tournaments")
      .select("id")
      .eq("slug", slug)
      .in("status", ["upcoming", "ongoing", "completed"]);
    if (error || !data) {
      return { items: [], total: 0, limit, offset, effectiveDateLabel, error: "Tournament not found." };
    }
    tournamentIds = data.map((r: any) => String(r.id));
  }

  // Optional sport filter: resolve sports -> tournament IDs.
  let sportTournamentIds: string[] | null = null;
  if (input.filters.sport && input.filters.sport.trim() && input.filters.sport !== "all") {
    const sport = input.filters.sport.trim();
    const { data, error } = await supabase
      .from("tournaments")
      .select("id")
      .eq("sport", sport)
      .in("status", ["upcoming", "ongoing", "completed"]);
    if (error || !data) {
      // If sport query fails, just skip filtering.
      sportTournamentIds = null;
    } else {
      sportTournamentIds = data.map((r: any) => String(r.id));
    }
  }

  // Main query: matches + tournaments (for context).
  let query = supabase
    .from("matches")
    .select(
      "id,tournament_id,status,scheduled_at,round_label,live_minute,home_team_id,away_team_id,home_score,away_score,tournaments(id,name,slug,sport,location)",
      { count: "exact" }
    )
    .in("status", statusSet)
    .range(offset, offset + limit - 1);

  if (tournamentIds && tournamentIds.length > 0) {
    query = query.in("tournament_id", tournamentIds);
  }

  if (sportTournamentIds && sportTournamentIds.length > 0) {
    query = query.in("tournament_id", sportTournamentIds);
  }

  if (applyDateRange) {
    query = query
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", start.toISOString())
      .lt("scheduled_at", endExclusive.toISOString());
  }

  // Order: keep basic ordering; final prioritization is done in-code for Today tab.
  if (input.filters.tab === "results") {
    query = query.order("scheduled_at", { ascending: false });
  } else if (input.filters.tab === "upcoming") {
    query = query.order("scheduled_at", { ascending: true });
  } else if (input.filters.tab === "live") {
    query = query.order("live_minute", { ascending: false });
  } else {
    query = query.order("scheduled_at", { ascending: true });
  }

  const { data, error, count } = await query;
  if (error) {
    return { items: [], total: null, limit, offset, effectiveDateLabel, error: error.message };
  }

  const matches = (data ?? []) as any[];

  const teamIds = Array.from(
    new Set(
      matches
        .flatMap((m) => [m.home_team_id, m.away_team_id])
        .filter(Boolean)
        .map((id) => String(id))
    )
  );

  const { data: teamsData } = teamIds.length
    ? await supabase.from("teams").select("id,name,logo_url").in("id", teamIds)
    : { data: [] as any[] };

  const teamById = new Map<string, any>(
    (teamsData ?? []).map((t: any) => [String(t.id), t])
  );

  const items: PublicMatchCenterItem[] = matches.map((m) => {
    const tournament = m.tournaments ?? {};
    const homeTeamId = m.home_team_id ? String(m.home_team_id) : null;
    const awayTeamId = m.away_team_id ? String(m.away_team_id) : null;

    const homeScore = m.home_score != null ? Number(m.home_score) : null;
    const awayScore = m.away_score != null ? Number(m.away_score) : null;

    const scoreText =
      homeScore != null && awayScore != null
        ? `${homeScore} - ${awayScore}`
        : null;

    const scheduledAt = m.scheduled_at ? String(m.scheduled_at) : null;
    const liveMinute = m.live_minute != null ? Number(m.live_minute) : null;

    const statusLabel = computeStatusLabel({
      status: String(m.status ?? ""),
      liveMinute,
      scheduledAt,
      scoreText,
      dateLabel: effectiveDateLabel,
    });

    const home = homeTeamId
      ? ({
          teamId: homeTeamId,
          teamName: String(teamById.get(homeTeamId)?.name ?? "Home"),
          logoUrl: (teamById.get(homeTeamId)?.logo_url as string | null) ?? null,
        } satisfies PublicMatchTeam)
      : null;

    const away = awayTeamId
      ? ({
          teamId: awayTeamId,
          teamName: String(teamById.get(awayTeamId)?.name ?? "Away"),
          logoUrl: (teamById.get(awayTeamId)?.logo_url as string | null) ?? null,
        } satisfies PublicMatchTeam)
      : null;

    return {
      id: String(m.id),
      tournamentName: String(tournament.name ?? "Tournament"),
      tournamentSlug: String(tournament.slug ?? ""),
      tournamentSport: String(tournament.sport ?? ""),
      location: (tournament.location as string | null) ?? null,
      status: String(m.status ?? "scheduled"),
      statusLabel,
      scoreText,
      scheduledAt,
      roundLabel: (m.round_label as string | null) ?? null,
      liveMinute,
      home,
      away,
    };
  });

  // Improve ordering for Today tab: live first, then scheduled by time, then results by time.
  if (input.filters.tab === "today") {
    items.sort((a, b) => {
      const prio = (s: string) =>
        s === "live" ? 0 : s === "scheduled" ? 2 : 1; // ft/completed => 1
      const pa = prio(a.status);
      const pb = prio(b.status);
      if (pa !== pb) return pa - pb;

      const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;

      // live: higher liveMinute first
      if (pa === 0) return (b.liveMinute ?? 0) - (a.liveMinute ?? 0);
      // scheduled/upcoming: ascending time
      if (pa === 2) return at - bt;
      // results: descending time
      return bt - at;
    });
  }

  return {
    items,
    total: typeof count === "number" ? count : null,
    limit,
    offset,
    effectiveDateLabel,
  };
}

export interface MatchCenterSummary {
  liveCount: number;
  activeTournaments: number;
  nextKickoffAt: string | null;
}

export interface MatchCenterTournamentOption {
  slug: string;
  name: string;
  sport: string;
}

export async function getMatchCenterSummary(): Promise<MatchCenterSummary> {
  const supabase = await createSupabaseServerClient();

  const { data: liveMatchesData } = await supabase
    .from("matches")
    .select("id,tournament_id")
    .eq("status", "live")
    .limit(200);

  const liveCount = liveMatchesData?.length ?? 0;

  const activeTournaments = Array.from(
    new Set((liveMatchesData ?? []).map((m: any) => String(m.tournament_id)))
  ).length;

  const { data: nextData } = await supabase
    .from("matches")
    .select("scheduled_at")
    .eq("status", "scheduled")
    .not("scheduled_at", "is", null)
    .gt("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1);

  const nextKickoffAt =
    nextData && nextData[0]?.scheduled_at
      ? String(nextData[0].scheduled_at)
      : null;

  return {
    liveCount,
    activeTournaments,
    nextKickoffAt,
  };
}

export async function listMatchCenterTournamentOptions(input?: {
  sport?: string;
  limit?: number;
}): Promise<MatchCenterTournamentOption[]> {
  const supabase = await createSupabaseServerClient();
  const limit = input?.limit ?? 30;

  let query = supabase
    .from("public_tournaments")
    .select("slug,name,sport")
    .order("start_date", { ascending: false })
    .limit(limit);

  if (input?.sport && input.sport !== "all") {
    query = query.eq("sport", input.sport);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as any[]).map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    sport: String(r.sport),
  }));
}

