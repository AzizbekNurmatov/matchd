"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_LEAGUES } from "@/lib/sports-data/constants";
import { isFootballCountryCode } from "@/lib/utils/countries";
import type { ProfileFavoriteTeam } from "@/types/database";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type TeamSearchResult = ProfileFavoriteTeam & {
  leagueName?: string | null;
};

export type TeamSearchLeague = "all" | (typeof SUPPORTED_LEAGUES)[number]["code"];

const TEAM_SEARCH_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FOOTBALL_DATA_ID = /^\d+$/;
const LEAGUE_PRIORITY = ["PL", "PD", "BL1", "SA", "FL1", "CL"] as const;

function normalizeOptional(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeSearch(query: string): string {
  return query.trim().replace(/[%_,()]/g, "").slice(0, 80);
}

function isRealClub(externalId: string | null): boolean {
  return Boolean(externalId && FOOTBALL_DATA_ID.test(externalId));
}

function leagueLabel(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }
  if (code === "CL") {
    return "Champions League";
  }
  return SUPPORTED_LEAGUES.find((league) => league.code === code)?.name ?? null;
}

function leagueRank(code: string | null | undefined): number {
  if (!code) {
    return 99;
  }
  const index = LEAGUE_PRIORITY.indexOf(
    code as (typeof LEAGUE_PRIORITY)[number],
  );
  return index === -1 ? 99 : index;
}

async function teamIdsForLeague(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leagueCode: string,
): Promise<string[]> {
  const { data: competition } = await supabase
    .from("competitions")
    .select("id")
    .eq("short_name", leagueCode)
    .maybeSingle();

  if (!competition) {
    return [];
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id")
    .eq("competition_id", competition.id)
    .limit(1000);

  const ids = new Set<string>();
  for (const row of matches ?? []) {
    ids.add(row.home_team_id);
    ids.add(row.away_team_id);
  }
  return [...ids];
}

async function leagueNamesForTeams(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamIds: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (teamIds.length === 0) {
    return names;
  }

  const { data } = await supabase
    .from("matches")
    .select(
      "home_team_id, away_team_id, competition:competitions!inner(name, short_name)",
    )
    .or(
      `home_team_id.in.(${teamIds.join(",")}),away_team_id.in.(${teamIds.join(",")})`,
    )
    .limit(400);

  const best = new Map<string, { name: string; rank: number }>();

  for (const row of data ?? []) {
    const competition = Array.isArray(row.competition)
      ? row.competition[0]
      : row.competition;
    const code = competition?.short_name ?? null;
    const name = leagueLabel(code) ?? competition?.name ?? null;
    if (!name) {
      continue;
    }

    const rank = leagueRank(code);
    for (const teamId of [row.home_team_id, row.away_team_id]) {
      if (!teamIds.includes(teamId)) {
        continue;
      }
      const current = best.get(teamId);
      if (!current || rank < current.rank) {
        best.set(teamId, { name, rank });
      }
    }
  }

  for (const [teamId, value] of best) {
    names.set(teamId, value.name);
  }

  return names;
}

export async function searchTeams(
  query: string,
  league: TeamSearchLeague = "all",
): Promise<TeamSearchResult[]> {
  const supabase = await createClient();
  const sanitized = sanitizeSearch(query);

  if (league === "all" && sanitized.length === 0) {
    return [];
  }

  let teamIds: string[] | null = null;
  if (league !== "all") {
    teamIds = await teamIdsForLeague(supabase, league);
    if (teamIds.length === 0) {
      return [];
    }
  }

  let request = supabase
    .from("teams")
    .select("id, name, short_name, crest_url, external_id")
    .not("external_id", "is", null)
    .order("name")
    .limit(TEAM_SEARCH_LIMIT);

  if (teamIds) {
    request = request.in("id", teamIds);
  }

  if (sanitized.length > 0) {
    request = request.or(
      `name.ilike.%${sanitized}%,short_name.ilike.%${sanitized}%`,
    );
  }

  const { data, error } = await request;
  if (error || !data) {
    return [];
  }

  const realClubs = data.filter((team) => isRealClub(team.external_id));
  const selectedLeagueName = league === "all" ? null : leagueLabel(league);
  const leagueByTeam =
    selectedLeagueName || realClubs.length === 0
      ? new Map<string, string>()
      : await leagueNamesForTeams(
          supabase,
          realClubs.map((team) => team.id),
        );

  return realClubs.map((team) => ({
    id: team.id,
    name: team.name,
    short_name: team.short_name,
    crest_url: team.crest_url,
    leagueName: selectedLeagueName ?? leagueByTeam.get(team.id) ?? null,
  }));
}

export async function updateUserProfile({
  countryCode,
  favoriteTeamId,
}: {
  countryCode: string | null;
  favoriteTeamId: string | null;
}): Promise<ActionResult> {
  const nextCountry = normalizeOptional(countryCode)?.toUpperCase() ?? null;
  const nextTeamId = normalizeOptional(favoriteTeamId);

  if (nextCountry && !isFootballCountryCode(nextCountry)) {
    return { ok: false, error: "Choose a country from the list." };
  }

  if (nextTeamId && !UUID_PATTERN.test(nextTeamId)) {
    return { ok: false, error: "That club could not be saved." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to log in to edit your profile." };
  }

  if (nextTeamId) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("id", nextTeamId)
      .maybeSingle();

    if (teamError || !team) {
      return { ok: false, error: "That club could not be found." };
    }
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      country_code: nextCountry,
      favorite_team_id: nextTeamId,
    })
    .eq("id", user.id)
    .select("username")
    .single();

  if (error || !profile) {
    return {
      ok: false,
      error: error?.message ?? "Could not update your profile.",
    };
  }

  revalidatePath(`/users/${profile.username}`);
  revalidatePath("/matches");
  revalidatePath("/matches/[id]", "page");
  return { ok: true };
}
