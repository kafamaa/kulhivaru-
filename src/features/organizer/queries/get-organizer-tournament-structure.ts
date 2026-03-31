import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface OrganizerTournamentFormatRule {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryShortLabel: string;
  formatType: string;
  groupCount: number;
  teamsAdvancePerGroup: number;
  includeBestRunnersUp: number;
  knockoutRound: string | null;
  roundRobinLegs: number;
  thirdPlaceMatch: boolean;
  autoGenerateFixtures: boolean;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  maxMatchesPerDayPerTeam: number;
  minRestMinutesBetweenMatches: number;
}

export interface OrganizerTournamentStructureData {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  sport: string;
  status: string;
  approvedTeams: { id: string; name: string }[];
  matchCount: number;
  categoryCount: number;
  categories: Array<{
    id: string;
    sourceCategoryId: string;
    name: string;
    shortLabel: string;
    visibility: string;
    matchDurationMinutes: number | null;
  }>;
  formatRules: OrganizerTournamentFormatRule[];
  formatRulesCount: number;
  categoryRuleConfigCount: number;
  phaseRuleConfigCount: number;
  hasTournamentRuleConfig: boolean;
  suggestions: string[];
}

function sortFormatRulesByCategoryOrder(
  rules: OrganizerTournamentFormatRule[],
  categoryOrder: string[]
): OrganizerTournamentFormatRule[] {
  const idx = new Map(categoryOrder.map((id, i) => [id, i]));
  return [...rules].sort((a, b) => {
    const ai = idx.get(a.categoryId) ?? 999;
    const bi = idx.get(b.categoryId) ?? 999;
    return ai - bi;
  });
}

export async function getOrganizerTournamentStructure(
  tournamentId: string
): Promise<OrganizerTournamentStructureData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: t, error: tError } = await supabase
    .from("tournaments")
    .select("id, name, slug, status, sport")
    .eq("id", tournamentId)
    .single();

  if (tError || !t) return null;

  const tournamentRow = t as {
    id: string;
    name: string;
    slug: string;
    status: string;
    sport: string | null;
  };

  const [
    entriesRes,
    matchCountRes,
    categoriesRes,
    formatRulesRes,
    categoryRuleCfgRes,
    phaseRuleCfgRes,
    tournamentRuleCfgRes,
  ] = await Promise.all([
    supabase
      .from("team_entries")
      .select("team_id, status")
      .eq("tournament_id", tournamentId)
      .eq("status", "approved"),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId),
    supabase
      .from("tournament_categories")
      .select("id, source_category_id, name, short_label, visibility, match_duration_minutes")
      .eq("tournament_id", tournamentId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tournament_format_rules")
      .select(
        `
        id,
        category_id,
        format_type,
        group_count,
        teams_advance_per_group,
        include_best_runners_up,
        knockout_round,
        round_robin_legs,
        third_place_match,
        auto_generate_fixtures,
        match_duration_minutes,
        break_duration_minutes,
        max_matches_per_day_per_team,
        min_rest_minutes_between_matches,
        tournament_categories ( name, short_label )
      `
      )
      .eq("tournament_id", tournamentId),
    supabase
      .from("category_rule_configs")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId),
    supabase
      .from("phase_rule_configs")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId),
    supabase
      .from("tournament_rule_configs")
      .select("id")
      .eq("tournament_id", tournamentId)
      .maybeSingle(),
  ]);

  const { data: entries } = entriesRes;

  const teamIds = (entries ?? []).map((e: any) => String(e.team_id));
  let approvedTeams: { id: string; name: string }[] = [];
  if (teamIds.length > 0) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds)
      .order("name");
    approvedTeams = (teams ?? []).map((r: any) => ({ id: String(r.id), name: String(r.name) }));
  }

  const matchCount = matchCountRes.count ?? 0;

  const categoriesRows = (categoriesRes.data ?? []) as Array<{
    id: string;
    source_category_id: string;
    name: string;
    short_label: string;
    visibility: string;
    match_duration_minutes: number | null;
  }>;

  const categoryCount = categoriesRows.length;
  const categoryIdsOrdered = categoriesRows.map((c) => String(c.id));

  type FrRow = {
    id: string;
    category_id: string;
    format_type: string;
    group_count: number;
    teams_advance_per_group: number;
    include_best_runners_up: number;
    knockout_round: string | null;
    round_robin_legs: number;
    third_place_match: boolean;
    auto_generate_fixtures: boolean;
    match_duration_minutes: number;
    break_duration_minutes: number;
    max_matches_per_day_per_team: number;
    min_rest_minutes_between_matches: number;
    tournament_categories: { name: string; short_label: string } | null;
  };

  const rawFormat = (formatRulesRes.data ?? []) as FrRow[];
  const formatRulesUnsorted: OrganizerTournamentFormatRule[] = rawFormat.map((r) => {
    const cat = r.tournament_categories;
    return {
      id: String(r.id),
      categoryId: String(r.category_id),
      categoryName: cat?.name ? String(cat.name) : "Category",
      categoryShortLabel: cat?.short_label ? String(cat.short_label) : "—",
      formatType: String(r.format_type),
      groupCount: Number(r.group_count),
      teamsAdvancePerGroup: Number(r.teams_advance_per_group),
      includeBestRunnersUp: Number(r.include_best_runners_up),
      knockoutRound: r.knockout_round != null ? String(r.knockout_round) : null,
      roundRobinLegs: Number(r.round_robin_legs),
      thirdPlaceMatch: Boolean(r.third_place_match),
      autoGenerateFixtures: Boolean(r.auto_generate_fixtures),
      matchDurationMinutes: Number(r.match_duration_minutes),
      breakDurationMinutes: Number(r.break_duration_minutes),
      maxMatchesPerDayPerTeam: Number(r.max_matches_per_day_per_team),
      minRestMinutesBetweenMatches: Number(r.min_rest_minutes_between_matches),
    };
  });

  const formatRules = sortFormatRulesByCategoryOrder(formatRulesUnsorted, categoryIdsOrdered);
  const formatRulesCount = formatRules.length;

  const categoryRuleConfigCount = categoryRuleCfgRes.count ?? 0;
  const phaseRuleConfigCount = phaseRuleCfgRes.count ?? 0;
  const hasTournamentRuleConfig = Boolean(tournamentRuleCfgRes.data);

  const suggestions: string[] = [];
  if (approvedTeams.length < 2) suggestions.push("Approve at least 2 teams to generate fixtures.");
  if (matchCount === 0) suggestions.push("Generate fixtures from Matches once teams are ready.");
  if (categoryCount === 0) {
    suggestions.push("No categories on file yet. Publish from the tournament wizard so categories, format rules, and rule configs are written to the database.");
  } else if (formatRulesCount === 0) {
    suggestions.push("Categories exist but no format rules row is linked. Re-publish from the wizard or check the publish payload.");
  }
  if (String(tournamentRow.status) === "draft") {
    suggestions.push("Set tournament status to upcoming/ongoing when ready.");
  }

  return {
    tournamentId: String(tournamentRow.id),
    tournamentName: String(tournamentRow.name),
    tournamentSlug: String(tournamentRow.slug),
    sport: String(tournamentRow.sport ?? ""),
    status: String(tournamentRow.status),
    approvedTeams,
    matchCount,
    categoryCount,
    categories: categoriesRows.map((c) => ({
      id: String(c.id),
      sourceCategoryId: String(c.source_category_id),
      name: String(c.name),
      shortLabel: String(c.short_label),
      visibility: String(c.visibility ?? "public"),
      matchDurationMinutes:
        c.match_duration_minutes != null ? Number(c.match_duration_minutes) : null,
    })),
    formatRules,
    formatRulesCount,
    categoryRuleConfigCount,
    phaseRuleConfigCount,
    hasTournamentRuleConfig,
    suggestions,
  };
}

