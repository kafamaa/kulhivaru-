import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { PublicTournamentCardData } from "../types";

export type ExploreStatusFilter = "all" | "ongoing" | "upcoming" | "completed" | "live";
export type ExploreSort =
  | "relevant"
  | "newest"
  | "startingSoon"
  | "updated"
  | "popular";
export type ExploreView = "grid" | "list";

export interface ExploreTournamentFilters {
  q?: string;
  status?: ExploreStatusFilter;
  sport?: string; // e.g. Football
  location?: string; // e.g. Malé
  organizer?: string; // e.g. GameOn League
}

export interface ExplorePublicTournamentsResult {
  items: PublicTournamentCardData[];
  total: number | null;
  limit: number;
  offset: number;
  error?: string;
}

const EXPLORE_COLUMNS =
  "id, slug, name, sport, location, status, start_date, cover_image_url, logo_url, organizer_name, team_count, is_registration_open";

export async function explorePublicTournaments(input: {
  filters: ExploreTournamentFilters;
  sort: ExploreSort;
  view?: ExploreView; // not used for query; UI only
  limit: number;
  offset: number;
}): Promise<ExplorePublicTournamentsResult> {
  const supabase = await createSupabaseServerClient();

  const limit = Math.max(1, Math.min(24, input.limit));
  const offset = Math.max(0, input.offset);

  const filters = input.filters;

  let query = supabase
    .from("public_tournaments")
    .select(EXPLORE_COLUMNS, { count: "exact" })
    .range(offset, offset + limit - 1);

  // Search (name, sport, location, organizer)
  const q = filters.q?.trim();
  if (q) {
    const like = `%${q}%`;
    query = query.or(
      [
        `name.ilike.${like}`,
        `sport.ilike.${like}`,
        `location.ilike.${like}`,
        `organizer_name.ilike.${like}`,
      ].join(",")
    );
  }

  // Status filter
  const status = filters.status ?? "all";
  if (status !== "all") {
    // View has only upcoming/ongoing/completed.
    // Treat "live" as "ongoing" for now (exact live match filtering can be added later).
    const mappedStatus: "ongoing" | "upcoming" | "completed" =
      status === "live"
        ? "ongoing"
        : (status as "ongoing" | "upcoming" | "completed");
    query = query.eq("status", mappedStatus);
  }

  if (filters.sport?.trim() && filters.sport.trim() !== "all") {
    query = query.eq("sport", filters.sport.trim());
  }

  if (filters.location?.trim()) {
    // location can be partial match (Malé / Male, etc.)
    query = query.ilike("location", `%${filters.location.trim()}%`);
  }

  if (filters.organizer?.trim()) {
    query = query.ilike("organizer_name", `%${filters.organizer.trim()}%`);
  }

  // Sorting
  const sort = input.sort;
  if (sort === "newest") {
    query = query.order("start_date", { ascending: false });
  } else if (sort === "startingSoon") {
    query = query.order("start_date", { ascending: true });
  } else if (sort === "popular") {
    // Placeholder: popularity requires additional data.
    query = query.order("team_count", { ascending: false });
  } else if (sort === "updated") {
    // View doesn't expose updated_at; fallback to newest.
    query = query.order("start_date", { ascending: false });
  } else {
    // relevant
    query = query
      .order("is_registration_open", { ascending: false })
      .order("start_date", { ascending: true });
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      items: [],
      total: null,
      limit,
      offset,
      error: error.message,
    };
  }

  const items: PublicTournamentCardData[] = (data ?? []).map(
    (row: Record<string, unknown>) => {
      const statusValue = row.status as PublicTournamentCardData["status"];
      return {
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name),
        sport: String(row.sport),
        location: (row.location as string) ?? null,
        status: statusValue,
        startDate: (row.start_date as string) ?? null,
        coverImageUrl: (row.cover_image_url as string) ?? null,
        logoUrl: (row.logo_url as string) ?? null,
        organizerName: (row.organizer_name as string) ?? null,
        teamCount: (row.team_count as number) ?? null,
        isRegistrationOpen: Boolean(row.is_registration_open),
      };
    }
  );

  return { items, total: typeof count === "number" ? count : null, limit, offset };
}

