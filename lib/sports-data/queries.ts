import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { toRatingNumber } from "@/lib/ratings";
import type { CatalogMatch, CatalogTab } from "@/lib/sports-data/catalog";
import {
  INTERNATIONAL_COMPETITIONS,
  SUPPORTED_LEAGUES,
  isInternationalCompetitionCode,
  isSupportedLeagueCode,
} from "@/lib/sports-data/constants";
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

export type TeamSearchHit = {
  id: string;
  name: string;
  shortName: string | null;
  crestUrl: string | null;
};

export type LeagueSearchHit = {
  id: string;
  name: string;
  code: string | null;
  detail: string | null;
  href: string;
};

export async function searchSoccerCatalog(query: string): Promise<{
  teams: TeamSearchHit[];
  leagues: LeagueSearchHit[];
  matches: CatalogMatch[];
}> {
  const safe = query.trim().replace(/[%_\\]/g, "");
  if (!safe) {
    return { teams: [], leagues: [], matches: [] };
  }

  const pattern = `%${safe}%`;
  const needle = safe.toLowerCase();
  const supabase = createPublicClient();
  const catalogCodes = [...SUPPORTED_LEAGUES, ...INTERNATIONAL_COMPETITIONS]
    .filter((league) =>
      `${league.code} ${league.name} ${league.country}`.toLowerCase().includes(needle),
    )
    .map((league) => league.code);

  const [teamsByName, teamsByShort, leaguesByName, leaguesByShort, leaguesByCountry, catalogLeagues] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, short_name, crest_url")
        .ilike("name", pattern)
        .order("name")
        .limit(8),
      supabase
        .from("teams")
        .select("id, name, short_name, crest_url")
        .ilike("short_name", pattern)
        .order("name")
        .limit(8),
      supabase
        .from("competitions")
        .select("id, name, short_name, country")
        .ilike("name", pattern)
        .order("name")
        .limit(6),
      supabase
        .from("competitions")
        .select("id, name, short_name, country")
        .ilike("short_name", pattern)
        .order("name")
        .limit(6),
      supabase
        .from("competitions")
        .select("id, name, short_name, country")
        .ilike("country", pattern)
        .order("name")
        .limit(6),
      catalogCodes.length > 0
        ? supabase
            .from("competitions")
            .select("id, name, short_name, country")
            .in("short_name", catalogCodes)
        : Promise.resolve({ data: [], error: null }),
    ]);

  for (const result of [teamsByName, teamsByShort, leaguesByName, leaguesByShort, leaguesByCountry, catalogLeagues]) {
    if (result.error) {
      console.error("Error searching soccer catalog:", result.error.message);
    }
  }

  const teams = dedupeById([
    ...(teamsByName.data ?? []),
    ...(teamsByShort.data ?? []),
  ])
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8)
    .map((team) => ({
      id: team.id,
      name: team.name,
      shortName: team.short_name,
      crestUrl: team.crest_url,
    }));

  const leagues = dedupeById([
    ...(leaguesByName.data ?? []),
    ...(leaguesByShort.data ?? []),
    ...(leaguesByCountry.data ?? []),
    ...(catalogLeagues.data ?? []),
  ])
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 6)
    .map((league) => ({
      id: league.id,
      name: league.name,
      code: league.short_name,
      detail: league.country,
      href: leagueHref(league.short_name),
    }));

  const teamIds = teams.map((team) => team.id);
  const competitionIds = leagues.map((league) => league.id);
  const matchQueries = [];

  if (teamIds.length > 0) {
    matchQueries.push(
      supabase
        .from("matches")
        .select(MATCH_SELECT)
        .in("home_team_id", teamIds)
        .order("kickoff_at", { ascending: false })
        .limit(12),
      supabase
        .from("matches")
        .select(MATCH_SELECT)
        .in("away_team_id", teamIds)
        .order("kickoff_at", { ascending: false })
        .limit(12),
    );
  }

  if (competitionIds.length > 0) {
    matchQueries.push(
      supabase
        .from("matches")
        .select(MATCH_SELECT)
        .in("competition_id", competitionIds)
        .order("kickoff_at", { ascending: false })
        .limit(12),
    );
  }

  const matchResults = await Promise.all(matchQueries);
  for (const result of matchResults) {
    if (result.error) {
      console.error("Error searching soccer matches:", result.error.message);
    }
  }

  const matches = await hydrateMatchRows(
    supabase,
    dedupeById(matchResults.flatMap((result) => result.data ?? []))
      .sort(
        (a, b) =>
          new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
      )
      .slice(0, 12),
  );

  return { teams, leagues, matches };
}

function leagueHref(code: string | null): string {
  if (code && isSupportedLeagueCode(code)) {
    return `/matches?league=${code}`;
  }
  if (code && isInternationalCompetitionCode(code)) {
    return "/matches?tab=international";
  }
  return "/matches";
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return [...byId.values()];
}

async function hydrateMatchRows(
  supabase: ReturnType<typeof createPublicClient>,
  rows: {
    id: string;
    kickoff_at: string;
    status: CatalogMatch["status"];
    home_score: number | null;
    away_score: number | null;
    competition: CatalogMatch["competition"] | NonNullable<CatalogMatch["competition"]>[] | null;
    home_team: CatalogMatch["home_team"] | NonNullable<CatalogMatch["home_team"]>[] | null;
    away_team: CatalogMatch["away_team"] | NonNullable<CatalogMatch["away_team"]>[] | null;
  }[],
): Promise<CatalogMatch[]> {
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
