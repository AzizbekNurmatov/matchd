"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_LEAGUES } from "@/lib/sports-data/constants";
import { isFootballCountryCode } from "@/lib/utils/countries";
import type { ProfileFavoriteTeam } from "@/types/database";

export type UpdateProfileResult =
  | { success: true; newUsername: string }
  | { error: string };

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const USERNAME_TAKEN = "Username is already taken.";
const USERNAME_INVALID =
  "Usernames must be 3-20 characters and use only letters, numbers, and underscores.";

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

function parseAvatarUrl(
  value: string | null,
): { url: string | null } | { error: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { url: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: "That photo could not be saved." };
  }

  let projectHost = "";
  try {
    projectHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    projectHost = "";
  }

  const allowedHost =
    parsed.hostname === projectHost || parsed.hostname.endsWith(".supabase.co");
  const publicAvatar = parsed.pathname.includes(
    "/storage/v1/object/public/avatars/",
  );

  if (parsed.protocol !== "https:" || !allowedHost || !publicAvatar) {
    return { error: "That photo could not be saved." };
  }

  return { url: parsed.toString() };
}

function cleanUsername(value: string): string | { error: string } {
  const trimmed = value.trim();
  if (!USERNAME_PATTERN.test(trimmed)) {
    return { error: USERNAME_INVALID };
  }

  return trimmed.toLowerCase();
}

export async function updateUserProfile({
  username,
  countryCode,
  favoriteTeamId,
  avatarUrl,
}: {
  username?: string;
  countryCode: string | null;
  favoriteTeamId: string | null;
  avatarUrl?: string | null;
}): Promise<UpdateProfileResult> {
  const nextCountry = normalizeOptional(countryCode)?.toUpperCase() ?? null;
  const nextTeamId = normalizeOptional(favoriteTeamId);

  if (nextCountry && !isFootballCountryCode(nextCountry)) {
    return { error: "Choose a country from the list." };
  }

  if (nextTeamId && !UUID_PATTERN.test(nextTeamId)) {
    return { error: "That club could not be saved." };
  }

  let nextAvatar: string | null | undefined;
  if (avatarUrl !== undefined) {
    const parsedAvatar = parseAvatarUrl(avatarUrl);
    if ("error" in parsedAvatar) {
      return parsedAvatar;
    }
    nextAvatar = parsedAvatar.url;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to log in to edit your profile." };
  }

  const { data: current, error: currentError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (currentError || !current) {
    return { error: "Could not update your profile." };
  }

  let newUsername = current.username;
  if (username !== undefined) {
    const cleaned = cleanUsername(username);
    if (typeof cleaned !== "string") {
      return cleaned;
    }
    newUsername = cleaned;
  }

  if (newUsername !== current.username) {
    const { data: taken, error: takenError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", newUsername)
      .neq("id", user.id)
      .maybeSingle();

    if (takenError) {
      return { error: "Could not check that username. Try again." };
    }

    if (taken) {
      return { error: USERNAME_TAKEN };
    }
  }

  if (nextTeamId) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("id", nextTeamId)
      .maybeSingle();

    if (teamError || !team) {
      return { error: "That club could not be found." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: newUsername,
      country_code: nextCountry,
      favorite_team_id: nextTeamId,
      ...(nextAvatar !== undefined ? { avatar_url: nextAvatar } : {}),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: USERNAME_TAKEN };
    }

    return { error: "Could not update your profile." };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { username: newUsername },
  });

  if (authError && newUsername !== current.username) {
    await supabase
      .from("profiles")
      .update({ username: current.username })
      .eq("id", user.id);
    revalidatePath(`/users/${current.username}`);

    return { error: "Could not update your username. Try again." };
  }

  revalidatePath(`/users/${current.username}`);
  revalidatePath(`/u/${current.username}`);
  if (newUsername !== current.username) {
    revalidatePath(`/users/${newUsername}`);
    revalidatePath(`/u/${newUsername}`);
  }
  revalidatePath("/matches");
  revalidatePath("/matches/[id]", "page");
  revalidatePath("/", "layout");
  return { success: true, newUsername };
}
