import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { parseFixtureContextFromRoundLabel } from "../lib/parse-fixture-context";

export type TournamentFixturesTab = "auto" | "all" | "live" | "results" | "upcoming";

export interface TournamentFixturesFilters {
  phaseKey?: string; // derived from round_label
  groupKey?: string; // derived from round_label; "overall" for no group
  date?: string; // today|tomorrow|yesterday|YYYY-MM-DD
  category?: string; // not available in MVP (schema does not include category on matches yet)
  venue?: string; // not available in MVP
}

export interface PublicFixtureTeam {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
}

export interface PublicTournamentFixtureItem {
  id: string;
  status: string; // live|scheduled|ft|completed
  statusLabel: string;
  scoreText: string | null;
  scheduledAt: string | null;
  liveMinute: number | null;

  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;

  phaseKey: string;
  phaseLabel: string;
  groupKey: string;
  groupLabel: string;

  home: PublicFixtureTeam | null;
  away: PublicFixtureTeam | null;

  venue: string | null;
  watchAvailable: boolean;
}

export interface FixturesPagePhaseOption {
  key: string;
  label: string;
}

export interface FixturesPageGroupOption {
  key: string;
  label: string;
}

export interface TournamentFixturesPageData {
  tournament: {
    id: string;
    slug: string;
    name: string;
    sport: string;
    location: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    organizerName: string | null;
  };

  effectiveTab: Exclude<TournamentFixturesTab, "auto">;
  items: PublicTournamentFixtureItem[];
  total: number;
  page: number;
  limit: number;

  summary: {
    totalMatches: number;
    playedMatches: number;
    remainingMatches: number;
  };

  phaseOptions: FixturesPagePhaseOption[];
  groupOptions: FixturesPageGroupOption[];
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatUtcTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

function parseDateToUtcRange(input: string): { start: Date; endExclusive: Date } | null {
  const now = new Date();

  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "today") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return { start, endExclusive: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }
  if (normalized === "tomorrow") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return { start, endExclusive: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }
  if (normalized === "yesterday") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    return { start, endExclusive: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const start = new Date(Date.UTC(year, month - 1, day));
    return { start, endExclusive: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }

  return null;
}

function statusToUiLabel(status: string, params: { homeScore: number | null; awayScore: number | null; scheduledAt: string | null; liveMinute: number | null }) {
  const { homeScore, awayScore, scheduledAt, liveMinute } = params;
  if (status === "live") {
    return liveMinute != null ? `Live ${liveMinute}'` : "Live";
  }
  if (status === "ft" || status === "completed") {
    const hs = homeScore ?? "—";
    const as = awayScore ?? "—";
    return `FT ${hs}-${as}`;
  }
  if (status === "scheduled") {
    if (!scheduledAt) return "Scheduled";
    return `${formatUtcTime(scheduledAt)} UTC`;
  }
  if (scheduledAt) return `${formatUtcTime(scheduledAt)} UTC`;
  return status;
}

export async function listPublicTournamentFixtures(input: {
  slug: string;
  tab: TournamentFixturesTab;
  filters: TournamentFixturesFilters;
  page: number;
  limit: number;
}): Promise<TournamentFixturesPageData> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, input.page);
  const limit = Math.max(1, Math.min(30, input.limit));

  // Tournament meta
  const { data: tournamentRow, error: tournamentErr } = await supabase
    .from("public_tournaments")
    .select(
      "id, slug, name, sport, location, status, start_date, cover_image_url, logo_url, organizer_name"
    )
    .eq("slug", input.slug)
    .single();

  if (tournamentErr || !tournamentRow) {
    throw new Error("Tournament not found.");
  }

  const tournament = {
    id: String(tournamentRow.id),
    slug: String(tournamentRow.slug),
    name: String(tournamentRow.name),
    sport: String(tournamentRow.sport),
    location: (tournamentRow.location as string | null) ?? null,
    status: String(tournamentRow.status),
    startDate: (tournamentRow.start_date as string | null) ?? null,
    endDate: null as string | null, // base view doesn't include end_date in MVP
    logoUrl: (tournamentRow.logo_url as string | null) ?? null,
    bannerUrl: (tournamentRow.cover_image_url as string | null) ?? null,
    organizerName: (tournamentRow.organizer_name as string | null) ?? null,
  };

  // Watch availability (public streams for this tournament)
  const { data: liveStreamRows } = await supabase
    .from("public_streams")
    .select("id")
    .eq("tournament_slug", input.slug)
    .eq("is_live", true)
    .limit(1);

  const watchAvailable = (liveStreamRows ?? []).length > 0;

  // Fetch all relevant matches for parsing + accurate filtering count.
  // MVP note: No explicit phase/group/category columns on matches exist right now,
  // so we derive phase/group from `round_label`.
  const { data: rawMatches, error: matchesErr } = await supabase
    .from("matches")
    .select(
      "id,status,scheduled_at,round_label,live_minute,home_team_id,away_team_id,home_score,away_score"
    )
    .eq("tournament_id", tournament.id)
    .in("status", ["live", "scheduled", "ft", "completed", "postponed", "cancelled"]);

  if (matchesErr) {
    throw new Error(matchesErr.message);
  }

  const matchesBase = (rawMatches ?? []).filter((m: any) => {
    const s = String(m.status);
    return s === "live" || s === "scheduled" || s === "ft" || s === "completed";
  });

  // Determine effective tab
  const liveAvailable = matchesBase.some((m: any) => String(m.status) === "live");
  const effectiveTab: Exclude<TournamentFixturesTab, "auto"> =
    input.tab === "auto" ? (liveAvailable ? "live" : "all") : input.tab;

  function statusAllowedByTab(status: string) {
    if (effectiveTab === "all") return ["live", "scheduled", "ft", "completed"].includes(status);
    if (effectiveTab === "live") return status === "live";
    if (effectiveTab === "upcoming") return status === "scheduled";
    // results
    return status === "ft" || status === "completed";
  }

  const phaseFilter = input.filters.phaseKey && input.filters.phaseKey !== "all" ? input.filters.phaseKey : undefined;
  const groupFilter = input.filters.groupKey && input.filters.groupKey !== "all" ? input.filters.groupKey : undefined;
  const dateFilter = input.filters.date;
  const utcRange = dateFilter ? parseDateToUtcRange(dateFilter) : null;

  // Parse context + apply tab/filters
  const parsed = matchesBase.map((m: any) => {
    const phaseGroup = parseFixtureContextFromRoundLabel(m.round_label as string | null);
    const homeScore = m.home_score != null ? Number(m.home_score) : null;
    const awayScore = m.away_score != null ? Number(m.away_score) : null;
    const scheduledAt = m.scheduled_at ? String(m.scheduled_at) : null;
    const liveMinute = m.live_minute != null ? Number(m.live_minute) : null;

    const status = String(m.status);
    const scoreText =
      homeScore != null && awayScore != null ? `${homeScore}-${awayScore}` : null;

    const statusLabel = statusToUiLabel(status, {
      homeScore,
      awayScore,
      scheduledAt,
      liveMinute,
    });

    return {
      raw: m,
      phaseKey: phaseGroup.phaseKey,
      phaseLabel: phaseGroup.phaseLabel,
      groupKey: phaseGroup.groupKey,
      groupLabel: phaseGroup.groupLabel,
      id: String(m.id),
      status,
      statusLabel,
      scoreText,
      scheduledAt,
      liveMinute,
      homeTeamId: m.home_team_id ? String(m.home_team_id) : null,
      awayTeamId: m.away_team_id ? String(m.away_team_id) : null,
    };
  });

  const filtered = parsed.filter((x) => {
    if (!statusAllowedByTab(x.status)) return false;
    if (phaseFilter && x.phaseKey !== phaseFilter) return false;
    if (groupFilter && x.groupKey !== groupFilter) return false;
    if (utcRange) {
      if (!x.scheduledAt) return false;
      const d = new Date(x.scheduledAt);
      if (Number.isNaN(d.getTime())) return false;
      if (!(d >= utcRange.start && d < utcRange.endExclusive)) return false;
    }
    return true;
  });

  // Sorting
  const sorted = filtered.sort((a, b) => {
    if (effectiveTab === "live") {
      const bm = b.liveMinute ?? -1;
      const am = a.liveMinute ?? -1;
      if (bm !== am) return bm - am;
      return (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "");
    }
    if (effectiveTab === "upcoming") {
      return (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "");
    }
    // results or all: prioritize latest first
    if (effectiveTab === "results") {
      return (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? "");
    }

    // all: live first, then results, then upcoming
    const pri = (s: string) => (s === "live" ? 0 : s === "ft" || s === "completed" ? 1 : 2);
    const pa = pri(a.status);
    const pb = pri(b.status);
    if (pa !== pb) return pa - pb;
    if (pa === 0) {
      const bm = b.liveMinute ?? -1;
      const am = a.liveMinute ?? -1;
      if (bm !== am) return bm - am;
    }
    return (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? "");
  });

  const totalFiltered = sorted.length;
  const offset = (page - 1) * limit;
  const pageItems = sorted.slice(offset, offset + limit);

  // Teams mapping for current page items
  const teamIds = Array.from(
    new Set(
      pageItems.flatMap((x) => [x.homeTeamId, x.awayTeamId]).filter(Boolean) as string[]
    )
  );

  const { data: teamsRows } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id,name,logo_url")
        .in("id", teamIds)
    : { data: [] };

  const teamById = new Map<string, any>(
    (teamsRows ?? []).map((t: any) => [String(t.id), t])
  );

  const items: PublicTournamentFixtureItem[] = pageItems.map((x) => ({
    id: x.id,
    status: x.status,
    statusLabel: x.statusLabel,
    scoreText: x.scoreText,
    scheduledAt: x.scheduledAt,
    liveMinute: x.liveMinute,

    tournamentName: tournament.name,
    tournamentSlug: tournament.slug,
    tournamentSport: tournament.sport,

    phaseKey: x.phaseKey,
    phaseLabel: x.phaseLabel,
    groupKey: x.groupKey,
    groupLabel: x.groupLabel,

    home: x.homeTeamId
      ? {
          teamId: x.homeTeamId,
          teamName: String(teamById.get(x.homeTeamId)?.name ?? "TBD"),
          logoUrl: (teamById.get(x.homeTeamId)?.logo_url as string | null) ?? null,
        }
      : null,
    away: x.awayTeamId
      ? {
          teamId: x.awayTeamId,
          teamName: String(teamById.get(x.awayTeamId)?.name ?? "TBD"),
          logoUrl: (teamById.get(x.awayTeamId)?.logo_url as string | null) ?? null,
        }
      : null,

    venue: null,
    watchAvailable,
  }));

  // Header summary counts (for whole tournament, not tab-filtered)
  const playedMatches = matchesBase.filter((m: any) => ["ft", "completed"].includes(String(m.status))).length;
  const totalMatches = matchesBase.length;
  const remainingMatches = Math.max(0, totalMatches - playedMatches);

  // Filter options from all matches (excluding postponed/cancelled)
  const allParsed = parsed;
  const phaseMap = new Map<string, string>();
  const groupMap = new Map<string, string>();

  for (const x of allParsed) {
    phaseMap.set(x.phaseKey, x.phaseLabel);
    groupMap.set(x.groupKey, x.groupLabel);
  }

  const phaseOrder = ["group-stage", "quarter-finals", "semi-finals", "final", "custom", "unknown"];
  const phaseOptions = Array.from(phaseMap.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => phaseOrder.indexOf(a.key) - phaseOrder.indexOf(b.key));

  const groupOptions = Array.from(groupMap.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => {
      if (a.key === "overall") return -1;
      if (b.key === "overall") return 1;
      return a.key.localeCompare(b.key);
    });

  // Ensure the select always has "All"
  const finalPhaseOptions: FixturesPagePhaseOption[] = [
    { key: "all", label: "All phases" },
    ...phaseOptions,
  ];

  const finalGroupOptions: FixturesPageGroupOption[] = [
    { key: "all", label: "All groups" },
    ...groupOptions,
  ];

  return {
    tournament,
    effectiveTab,
    items,
    total: totalFiltered,
    page,
    limit,
    summary: {
      totalMatches,
      playedMatches,
      remainingMatches,
    },
    phaseOptions: finalPhaseOptions,
    groupOptions: finalGroupOptions,
  };
}

