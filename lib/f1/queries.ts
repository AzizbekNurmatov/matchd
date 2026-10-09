import "server-only";

import { unstable_cache } from "next/cache";
import { fetchSeasonCalendar } from "@/lib/f1/calendar";
import type { F1RaceCardData } from "@/lib/f1/types";
import { toRatingNumber } from "@/lib/ratings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const getCachedF1Calendar = unstable_cache(
  async () => fetchSeasonCalendar(),
  ["f1-calendar-v1"],
  { revalidate: 60 * 60 * 6, tags: ["f1"] },
);

export async function listF1Races(): Promise<F1RaceCardData[]> {
  const races = await getCachedF1Calendar();
  await persistIfEmpty(races);
  const ratings = await loadUserRatings(races.map((race) => race.id));
  return races.map((race) => ({
    ...race,
    userRating: ratings.get(race.id) ?? null,
  }));
}

export async function searchF1Races(query: string): Promise<F1RaceCardData[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const races = await listF1Races();
  return races
    .filter((race) => {
      const haystack = [
        race.name,
        race.circuitName,
        race.country,
        race.winnerDriver,
        race.winnerTeam,
        ...race.drivers,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .slice(0, 6);
}

async function loadUserRatings(raceIds: string[]) {
  const ratings = new Map<string, number>();
  if (raceIds.length === 0) {
    return ratings;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return ratings;
    }

    const { data, error } = await supabase
      .from("f1_race_ratings")
      .select("race_id, rating")
      .eq("user_id", user.id)
      .in("race_id", raceIds);

    if (error || !data) {
      if (error && !isMissingTable(error.message)) {
        console.error("Error loading F1 ratings:", error.message);
      }
      return ratings;
    }

    for (const row of data) {
      const value = toRatingNumber(row.rating);
      if (row.race_id && value != null) {
        ratings.set(row.race_id, value);
      }
    }
  } catch (error) {
    console.error("Error loading F1 ratings:", error);
  }

  return ratings;
}

async function persistIfEmpty(races: F1RaceCardData[]) {
  if (races.length === 0) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("f1_races")
      .select("id", { count: "exact", head: true });
    if (error || (count ?? 0) > 0) {
      if (error && !isMissingTable(error.message)) {
        console.error("Error checking F1 races:", error.message);
      }
      return;
    }

    const rows = races.flatMap((race) => {
      const row = toRaceRow(race);
      return row ? [row] : [];
    });
    if (rows.length === 0) {
      return;
    }

    const { error: upsertError } = await admin
      .from("f1_races")
      .upsert(rows, { onConflict: "id" });
    if (upsertError) {
      console.error("Error saving F1 races:", upsertError.message);
    }
  } catch (error) {
    console.error("F1 persist skipped:", error);
  }
}

function toRaceRow(race: F1RaceCardData): F1RaceRow | null {
  const id = textOrNull(race.id);
  const name = textOrNull(race.name);
  const date = textOrNull(race.startsAt);
  if (!id || !name || !date || !Number.isFinite(race.season)) {
    return null;
  }
  if (Number.isNaN(Date.parse(date))) {
    return null;
  }

  return {
    id,
    season: race.season,
    name,
    circuit: textOrNull(race.circuitName),
    date,
    status: textOrNull(race.status),
    winner: toWinner(race),
    sessions: toSessions(race.sessions),
  };
}

type F1RaceRow = {
  id: string;
  season: number;
  name: string;
  circuit: string | null;
  date: string;
  status: string | null;
  winner: Json | null;
  sessions: Json;
};

function toWinner(race: F1RaceCardData): Json | null {
  const driver = textOrNull(race.winnerDriver);
  if (!driver) {
    return null;
  }

  const winner: { [key: string]: Json } = { driver };
  const team = textOrNull(race.winnerTeam);
  const image = textOrNull(race.winnerDriverImage);
  if (team) {
    winner.team = team;
  }
  if (image) {
    winner.image = image;
  }
  return winner;
}

function toSessions(sessions: F1RaceCardData["sessions"]): Json {
  return sessions.flatMap((session) => {
    const id = textOrNull(session.id);
    const startsAt = textOrNull(session.startsAt);
    if (!id || !startsAt || Number.isNaN(Date.parse(startsAt))) {
      return [];
    }

    const entry: { [key: string]: Json } = {
      id,
      type: textOrNull(session.type) ?? "Session",
      label: textOrNull(session.label) ?? textOrNull(session.type) ?? "Session",
      startsAt,
    };
    const status = textOrNull(session.status);
    if (status) {
      entry.status = status;
    }
    return [entry];
  });
}

function textOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function isMissingTable(message: string) {
  return /f1_races|f1_race_ratings|schema cache|does not exist/i.test(message);
}
