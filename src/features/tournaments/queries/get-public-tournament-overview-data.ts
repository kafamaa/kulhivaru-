import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { PublicMatchCenterItem } from "@/src/features/matches/queries/list-public-matches-center";
import { getPublicTournamentMedia } from "@/src/features/tournaments/queries/get-public-tournament-media";
import { getPublicTournamentTeams } from "@/src/features/tournaments/queries/get-public-tournament-teams";
import { getTopAssistsPreview } from "@/src/features/stats/queries/get-top-assists-preview";
import { getTopScorersByTournamentPreview } from "@/src/features/stats/queries/get-top-scorers-by-tournament-preview";
import type {
  TopAssistPreview,
} from "@/src/features/stats/queries/get-top-assists-preview";
import type {
  TopScorerByTournamentPreview,
} from "@/src/features/stats/queries/get-top-scorers-by-tournament-preview";
import type { PublicTournamentTeam } from "./get-public-tournament-teams";

export interface TournamentOverviewGroupOption {
  groupId: string | null;
  label: string;
  teamsCount: number;
}

export interface TournamentOverviewTournamentMeta {
  tournamentId: string;
  slug: string;
  name: string;
  organizerName: string | null;
  sport: string;
  location: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  teamCount: number;
}

export interface TournamentOverviewSummary {
  teamsCount: number;
  matchesCount: number;
  categoriesCount: number;
  currentPhaseLabel: string;
}

export interface TournamentOverviewStandingsRow {
  rank: number;
  teamId: string;
  teamName: string;
  played: number;
  points: number;
  logoUrl: string | null;
}

export interface TournamentOverviewData {
  tournament: TournamentOverviewTournamentMeta;
  groups: TournamentOverviewGroupOption[];
  selectedGroupId: string | null;
  summary: TournamentOverviewSummary;
  featuredMatch: PublicMatchCenterItem | null;
  upcomingMatches: PublicMatchCenterItem[];
  recentResults: PublicMatchCenterItem[];
  standingsPreview: TournamentOverviewStandingsRow[];
  topScorers: TopScorerByTournamentPreview[];
  topAssists: TopAssistPreview[];
  teamsPreview: Array<{
    teamId: string;
    teamName: string;
    logoUrl: string | null;
    entryStatus: PublicTournamentTeam["entryStatus"];
    rankInSelectedGroup: number | null;
  }>;
  mediaPreview: Awaited<ReturnType<typeof getPublicTournamentMedia>>;
  sponsorsPreview: Array<{
    id: string;
    name: string;
    tier: string | null;
    logoUrl: string | null;
  }>;
}

function labelForGroup(groupId: string | null) {
  if (!groupId) return "Overall";
  return `Group ${groupId.slice(0, 6)}`;
}

function phaseFromStatus(status: string, nonNullGroupCount: number) {
  if (status === "upcoming") return "Upcoming";
  if (status === "ongoing") return nonNullGroupCount > 0 ? "Group Stage" : "Knockout";
  if (status === "completed") return nonNullGroupCount > 0 ? "Finals" : "Finals";
  return "TBD";
}

export async function getPublicTournamentOverviewData(input: {
  slug: string;
  selectedGroupId?: string | null;
}): Promise<TournamentOverviewData> {
  const supabase = await createSupabaseServerClient();
  const { slug } = input;

  // Tournament meta
  const { data: tRow, error: tErr } = await supabase
    .from("public_tournaments")
    .select(
      "id, slug, name, organizer_name, sport, location, status, start_date, cover_image_url, logo_url, team_count"
    )
    .eq("slug", slug)
    .single();

  if (tErr || !tRow) {
    throw new Error("Tournament not found.");
  }

  const tournamentId = String(tRow.id);

  const { data: baseT, error: baseTerr } = await supabase
    .from("tournaments")
    .select("start_date, end_date")
    .eq("id", tournamentId)
    .single();

  const startDate =
    (baseT?.start_date as string | null | undefined) ??
    ((tRow.start_date as string | null | undefined) ?? null);

  const endDate = (baseT?.end_date as string | null | undefined) ?? null;

  const tournament: TournamentOverviewTournamentMeta = {
    tournamentId,
    slug: String(tRow.slug),
    name: String(tRow.name),
    organizerName: (tRow.organizer_name as string | null) ?? null,
    sport: String(tRow.sport),
    location: (tRow.location as string | null) ?? null,
    status: String(tRow.status),
    startDate,
    endDate,
    logoUrl: (tRow.logo_url as string | null) ?? null,
    bannerUrl: (tRow.cover_image_url as string | null) ?? null,
    teamCount: Number(tRow.team_count ?? 0) ?? 0,
  };

  // Groups / categories (from standings_cache group_id presence)
  const { data: standingsRowsForGroups } = await supabase
    .from("standings_cache")
    .select("group_id, team_id")
    .eq("tournament_id", tournamentId);

  const groupStats = new Map<string | null, number>();
  for (const r of (standingsRowsForGroups ?? []) as Array<{
    group_id: string | null;
    team_id: string;
  }>) {
    const gid = (r.group_id as string | null) ?? null;
    groupStats.set(gid, (groupStats.get(gid) ?? 0) + 1);
  }

  // Ensure we always have at least one option for the selector
  if (groupStats.size === 0) {
    groupStats.set(null, 0);
  }

  const groups: TournamentOverviewGroupOption[] = Array.from(groupStats.entries())
    .map(([groupId, teamsCount]) => ({
      groupId,
      label: labelForGroup(groupId),
      teamsCount,
    }))
    .sort((a, b) => {
      // Most active first (highest teams_count), then keep Overall first
      if (a.groupId === null && b.groupId !== null) return -1;
      if (b.groupId === null && a.groupId !== null) return 1;
      return b.teamsCount - a.teamsCount;
    });

  const nonNullGroupCount = groups.filter((g) => g.groupId !== null).length;
  const categoriesCount = nonNullGroupCount > 0 ? nonNullGroupCount : 1;

  const defaultSelectedGroup =
    (() => {
      const active = groups.find((g) => g.teamsCount === Math.max(...groups.map((x) => x.teamsCount)));
      return active?.groupId ?? null;
    })() ?? null;

  const selectedGroupId = (() => {
    if (input.selectedGroupId === undefined) return defaultSelectedGroup;
    if (input.selectedGroupId === "overall") return null;
    const candidate = input.selectedGroupId;
    const exists = groups.some((g) => g.groupId === (candidate ?? null));
    return exists ? (candidate ?? null) : defaultSelectedGroup;
  })();

  // Summary counts
  const { count: teamsCountCount } = await supabase
    .from("team_entries")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .eq("status", "approved");

  const teamsCount = Number(teamsCountCount ?? 0) || tournament.teamCount;

  const { count: matchesCountCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .in("status", ["scheduled", "live", "ft", "completed"]);

  const matchesCount = Number(matchesCountCount ?? 0) || 0;

  const currentPhaseLabel = phaseFromStatus(
    tournament.status,
    nonNullGroupCount > 0 ? nonNullGroupCount : 0
  );

  const summary: TournamentOverviewSummary = {
    teamsCount: Number(teamsCount ?? 0),
    matchesCount: Number(matchesCount ?? 0),
    categoriesCount,
    currentPhaseLabel,
  };

  async function fetchTeamsByIds(teamIds: string[]) {
    if (teamIds.length === 0) return new Map<string, any>();
    const { data } = await supabase
      .from("teams")
      .select("id,name,logo_url")
      .in("id", teamIds);
    return new Map<string, any>(
      (data ?? []).map((t: any) => [String(t.id), t])
    );
  }

  function toCardMatch(
    raw: any,
    meta: {
      tournamentName: string;
      tournamentSlug: string;
      tournamentSport: string;
      location: string | null;
      homeTeam: any | null;
      awayTeam: any | null;
    }
  ): PublicMatchCenterItem {
    const status = String(raw.status);
    const homeScore = raw.home_score != null ? Number(raw.home_score) : null;
    const awayScore = raw.away_score != null ? Number(raw.away_score) : null;

    let statusLabel = raw.status;
    let scoreText: string | null = null;

    if (status === "live") {
      statusLabel =
        raw.live_minute != null ? `Live ${Number(raw.live_minute)}'` : "Live";
      scoreText =
        homeScore != null && awayScore != null ? `${homeScore}-${awayScore}` : null;
    } else if (status === "ft" || status === "completed") {
      statusLabel = `FT ${homeScore ?? "—"}-${awayScore ?? "—"}`;
      scoreText =
        homeScore != null && awayScore != null ? `${homeScore}-${awayScore}` : null;
    } else if (status === "scheduled") {
      if (raw.scheduled_at) {
        const d = new Date(raw.scheduled_at);
        statusLabel = `${d.toISOString().slice(11, 16)} UTC`;
      } else {
        statusLabel = "Scheduled";
      }
    }

    return {
      id: String(raw.id),
      tournamentName: meta.tournamentName,
      tournamentSlug: meta.tournamentSlug,
      tournamentSport: meta.tournamentSport,
      location: meta.location,
      status,
      statusLabel,
      scoreText,
      scheduledAt: raw.scheduled_at ? String(raw.scheduled_at) : null,
      roundLabel: raw.round_label ? String(raw.round_label) : null,
      liveMinute: raw.live_minute != null ? Number(raw.live_minute) : null,
      home: meta.homeTeam
        ? {
            teamId: String(meta.homeTeam.id),
            teamName: String(meta.homeTeam.name),
            logoUrl: (meta.homeTeam.logo_url as string | null) ?? null,
          }
        : null,
      away: meta.awayTeam
        ? {
            teamId: String(meta.awayTeam.id),
            teamName: String(meta.awayTeam.name),
            logoUrl: (meta.awayTeam.logo_url as string | null) ?? null,
          }
        : null,
    };
  }

  // Matches preview
  const [liveMatches, scheduledMatches, recentMatches] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id,tournament_id,status,scheduled_at,round_label,live_minute,home_team_id,away_team_id,home_score,away_score"
      )
      .eq("tournament_id", tournamentId)
      .eq("status", "live")
      .order("live_minute", { ascending: false })
      .limit(1),
    supabase
      .from("matches")
      .select(
        "id,tournament_id,status,scheduled_at,round_label,live_minute,home_team_id,away_team_id,home_score,away_score"
      )
      .eq("tournament_id", tournamentId)
      .eq("status", "scheduled")
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("matches")
      .select(
        "id,tournament_id,status,scheduled_at,round_label,live_minute,home_team_id,away_team_id,home_score,away_score"
      )
      .eq("tournament_id", tournamentId)
      .in("status", ["ft", "completed"])
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(5),
  ]);

  const allMatchTeamIds = Array.from(
    new Set(
      ([] as any[])
        .concat(liveMatches.data ?? [])
        .concat(scheduledMatches.data ?? [])
        .concat(recentMatches.data ?? [])
        .flatMap((m: any) => [m.home_team_id, m.away_team_id])
        .filter(Boolean)
        .map((id: any) => String(id))
    )
  );

  const teamsById = await fetchTeamsByIds(allMatchTeamIds);

  const tournamentMeta = {
    tournamentName: tournament.name,
    tournamentSlug: tournament.slug,
    tournamentSport: tournament.sport,
    location: tournament.location,
  };

  const liveMatchCard = (liveMatches.data ?? [])[0]
    ? toCardMatch(liveMatches.data[0], {
        ...tournamentMeta,
        location: tournament.location,
        homeTeam: teamsById.get(String(liveMatches.data[0].home_team_id)) ?? null,
        awayTeam: teamsById.get(String(liveMatches.data[0].away_team_id)) ?? null,
      })
    : null;

  const upcomingMatchesCards: PublicMatchCenterItem[] = (scheduledMatches.data ?? []).map((m: any) =>
    toCardMatch(m, {
      ...tournamentMeta,
      location: tournament.location,
      homeTeam: teamsById.get(String(m.home_team_id)) ?? null,
      awayTeam: teamsById.get(String(m.away_team_id)) ?? null,
    })
  );

  const recentResultsCards: PublicMatchCenterItem[] = (recentMatches.data ?? []).map((m: any) =>
    toCardMatch(m, {
      ...tournamentMeta,
      location: tournament.location,
      homeTeam: teamsById.get(String(m.home_team_id)) ?? null,
      awayTeam: teamsById.get(String(m.away_team_id)) ?? null,
    })
  );

  const featuredMatch =
    liveMatchCard ??
    upcomingMatchesCards[0] ??
    recentResultsCards[0] ??
    null;

  // Standings preview (top teams)
  let standingsRows = [];
  if (selectedGroupId === null) {
    const { data } = await supabase
      .from("standings_cache")
      .select("rank, team_id, points, played")
      .eq("tournament_id", tournamentId)
      .is("group_id", null)
      .order("rank", { ascending: true })
      .limit(6);
    standingsRows = (data ?? []) as any[];
  } else {
    const { data } = await supabase
      .from("standings_cache")
      .select("rank, team_id, points, played")
      .eq("tournament_id", tournamentId)
      .eq("group_id", selectedGroupId)
      .order("rank", { ascending: true })
      .limit(6);
    standingsRows = (data ?? []) as any[];
  }

  const standingsTeamIds = Array.from(
    new Set(standingsRows.map((r: any) => String(r.team_id)))
  );
  const { data: teamsForStandings } = await supabase
    .from("teams")
    .select("id,name,logo_url")
    .in("id", standingsTeamIds);

  const teamByIdForStandings = new Map<string, any>(
    (teamsForStandings ?? []).map((t: any) => [String(t.id), t])
  );

  const standingsPreview: TournamentOverviewStandingsRow[] = standingsRows.map(
    (r: any) => {
      const t = teamByIdForStandings.get(String(r.team_id));
      return {
        rank: Number(r.rank ?? 0),
        teamId: String(r.team_id),
        teamName: String(t?.name ?? "Team"),
        played: Number(r.played ?? 0),
        points: Number(r.points ?? 0),
        logoUrl: (t?.logo_url as string | null) ?? null,
      };
    }
  );

  // Teams preview (first 8 approved)
  const teams = await getPublicTournamentTeams(slug);
  const approvedTeams = teams.filter((t) => t.entryStatus === "approved");

  const rankByTeamId = new Map<string, number>(
    standingsPreview.map((r) => [r.teamId, r.rank])
  );

  const teamsPreview = approvedTeams.slice(0, 8).map((t) => ({
    teamId: t.teamId,
    teamName: t.teamName,
    logoUrl: t.teamLogoUrl,
    entryStatus: t.entryStatus,
    rankInSelectedGroup: rankByTeamId.get(t.teamId) ?? null,
  }));

  // Stats preview
  const [topScorers, topAssists, mediaPreview, sponsorRows] = await Promise.all([
    getTopScorersByTournamentPreview(5, slug),
    getTopAssistsPreview(5, slug),
    getPublicTournamentMedia(slug),
    supabase
      .from("public_tournament_sponsors")
      .select("id, file_url, sponsor_name, sponsor_tier, created_at, sort_order")
      .eq("tournament_slug", slug)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const sponsorsPreview = ((sponsorRows.data ?? []) as Array<Record<string, unknown>>).map(
    (r) => ({
      id: String(r.id),
      name: String(r.sponsor_name ?? "Sponsor"),
      tier: (r.sponsor_tier as string | null) ?? null,
      logoUrl: (r.file_url as string | null) ?? null,
    })
  );

  return {
    tournament,
    groups,
    selectedGroupId,
    summary,
    featuredMatch,
    upcomingMatches: upcomingMatchesCards.slice(0, 5),
    recentResults: recentResultsCards.slice(0, 5),
    standingsPreview,
    topScorers,
    topAssists,
    teamsPreview,
    mediaPreview,
    sponsorsPreview,
  };
}

