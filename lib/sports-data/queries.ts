import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { toRatingNumber } from "@/lib/ratings";
import type { CatalogMatch, CatalogTab } from "@/lib/sports-data/catalog";
import { INTERNATIONAL_COMPETITIONS } from "@/lib/sports-data/constants";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type { CatalogMatch, CatalogTab } from "@/lib/sports-data/catalog";

export const CATALOG_PAGE_SIZE = 20;

const MATCH_SELECT = `
  id,
  kickoff_at,
  status,
  home_score,
  away_score,
  competition:competitions!inner (id, name, short_name),
  home_team:teams!matches_home_team_id_fkey (name, short_name, crest_url),
  away_team:teams!matches_away_team_id_fkey (name, short_name, crest_url)
`;

const INTERNATIONAL_WINDOW_DAYS = 7;
const MS_PER_DAY = 86_400_000;

function createPublicClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function loadRatings(
  supabase: ReturnType<typeof createPublicClient>,
  matchIds: string[],
) {
  const ratings = new Map<string, number>();
  if (matchIds.length === 0) {
    return ratings;
  }

  const { data, error } = await supabase
    .from("match_rating_stats")
    .select("match_id, average_rating")
    .in("match_id", matchIds);

  if (error || !data) {
    return ratings;
  }

  for (const row of data) {
    if (!row.match_id) {
      continue;
    }
    const value = toRatingNumber(row.average_rating);
    if (value != null) {
      ratings.set(row.match_id, value);
    }
  }

  return ratings;
}

async function fetchCatalogMatches(
  leagueCode: string,
  tab: string,
  page: number,
): Promise<CatalogMatch[]> {
  const supabase = createPublicClient();
  const now = new Date().toISOString();
  const from = (page - 1) * CATALOG_PAGE_SIZE;
  const to = from + CATALOG_PAGE_SIZE - 1;

  let query = supabase.from("matches").select(MATCH_SELECT);

  if (leagueCode !== "all") {
    query = query.eq("competition.short_name", leagueCode);
  }

  // Stored statuses are the mapped values: finished, scheduled, live.
  // Football-Data FT/FINISHED and API-Sports FT become `finished`.
  // TIMED/SCHEDULED/NS become `scheduled`.
  if (tab === "recent") {
    query = query
      .eq("status", "finished")
      .lte("kickoff_at", now)
      .order("kickoff_at", { ascending: false })
      .range(from, to);
  } else if (tab === "upcoming") {
    query = query
      .eq("status", "scheduled")
      .gt("kickoff_at", now)
      .order("kickoff_at", { ascending: true })
      .range(from, to);
  } else {
    query = query.order("kickoff_at", { ascending: false }).range(0, 99);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching cached catalog matches:", error);
    return [];
  }

  const rows = data ?? [];
  const ratingByMatch = await loadRatings(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id,
    kickoff_at: row.kickoff_at,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    competition: asSingle(row.competition),
    home_team: asSingle(row.home_team),
    away_team: asSingle(row.away_team),
    averageRating: ratingByMatch.get(row.id) ?? null,
  }));
}

export async function getCachedCatalogMatches(
  leagueCode: string,
  tab: CatalogTab,
  page: number,
): Promise<CatalogMatch[]> {
  return unstable_cache(
    async () => fetchCatalogMatches(leagueCode, tab, page),
    ["matches-catalog-v2", leagueCode, tab, page.toString()],
    { revalidate: 300, tags: ["matches"] },
  )();
}

async function fetchInternationalWindowMatches(): Promise<CatalogMatch[]> {
  const supabase = createPublicClient();
  const now = Date.now();
  const from = new Date(now - INTERNATIONAL_WINDOW_DAYS * MS_PER_DAY).toISOString();
  const to = new Date(now + INTERNATIONAL_WINDOW_DAYS * MS_PER_DAY).toISOString();

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .in(
      "competition.short_name",
      INTERNATIONAL_COMPETITIONS.map((competition) => competition.code),
    )
    .gte("kickoff_at", from)
    .lte("kickoff_at", to)
    .order("kickoff_at", { ascending: true });

  if (error) {
    console.error("Error fetching international window matches:", error);
    return [];
  }

  const rows = data ?? [];
  const ratingByMatch = await loadRatings(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id,
    kickoff_at: row.kickoff_at,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    competition: asSingle(row.competition),
    home_team: asSingle(row.home_team),
    away_team: asSingle(row.away_team),
    averageRating: ratingByMatch.get(row.id) ?? null,
  }));
}

export async function getCachedInternationalWindowMatches(): Promise<
  CatalogMatch[]
> {
  return unstable_cache(
    async () => fetchInternationalWindowMatches(),
    ["matches-international-window"],
    { revalidate: 300, tags: ["matches"] },
  )();
}

export async function getCachedLeagueMatches(league: string): Promise<{
  matches: CatalogMatch[];
}> {
  const [recentMatches, upcomingMatches] = await Promise.all([
    getCachedCatalogMatches(league, "recent", 1),
    getCachedCatalogMatches(league, "upcoming", 1),
  ]);

  const byId = new Map<string, CatalogMatch>();
  for (const match of [...recentMatches, ...upcomingMatches]) {
    byId.set(match.id, match);
  }

  return {
    matches: [...byId.values()].sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    ),
  };
}
