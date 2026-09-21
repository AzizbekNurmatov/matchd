"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isFootballCountryCode } from "@/lib/utils/countries";
import type { ProfileFavoriteTeam } from "@/types/database";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type TeamSearchResult = ProfileFavoriteTeam;

const TEAM_SEARCH_LIMIT = 12;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeOptional(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function searchTeams(query: string): Promise<TeamSearchResult[]> {
  const supabase = await createClient();
  const sanitized = query.trim().replace(/[%_,]/g, "").slice(0, 80);

  let request = supabase
    .from("teams")
    .select("id, name, short_name, crest_url")
    .order("name")
    .limit(TEAM_SEARCH_LIMIT);

  if (sanitized.length > 0) {
    request = request.ilike("name", `%${sanitized}%`);
  }

  const { data, error } = await request;
  if (error || !data) {
    return [];
  }

  return data;
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
