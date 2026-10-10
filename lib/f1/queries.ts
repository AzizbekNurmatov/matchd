import "server-only";

import { unstable_cache } from "next/cache";
import {
  F1SeasonUnavailableError,
  fetchSeasonCalendar,
} from "@/lib/f1/calendar";
import { isPlanError, isRateLimitError } from "@/lib/f1/api";
import type { F1RaceCardData } from "@/lib/f1/types";
import { toRatingNumber } from "@/lib/ratings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const currentSeason = new Date().getFullYear();

const getCachedF1Calendar = unstable_cache(
  async () => fetchSeasonCalendar(currentSeason),
  ["f1-calendar", String(currentSeason)],
  { revalidate: 60 * 60 * 6, tags: ["f1"] },
);

export type F1RaceListing = {
  season: number;
  completed: F1RaceCardData[];
  upcoming: F1RaceCardData[];
};

export async function listF1Races(): Promise<F1RaceListing> {
  const races = await loadF1Calendar();
  const ratings = await loadUserRatings(races.map((race) => race.id));
  return groupRaces(
    races.map((race) => ({
      ...race,
      userRating: ratings.get(race.id) ?? null,
    })),
  );
}

async function loadF1Calendar(): Promise<F1RaceCardData[]> {
  try {
    const races = await getCachedF1Calendar();
    await persistIfEmpty(races);
    return races;
  } catch (error) {
    if (!shouldUseStoredRaces(error)) {
      throw error;
    }
    console.error("F1 API unavailable, using stored races:", error);
    return loadStoredF1Races();
  }
}

export async function searchF1Races(query: string): Promise<F1RaceCardData[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const { completed, upcoming } = await listF1Races();
  const races = [...upcoming, ...completed];
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

async function loadStoredF1Races(): Promise<F1RaceCardData[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("f1_races")
      .select("id, season, name, circuit, date, status, winner, sessions")
      .order("date", { ascending: true });

    if (error || !data) {
      if (error) {
        console.error("Error loading stored F1 races:", error.message);
      }
      return [];
    }

    const season = new Date().getFullYear();
    const current = data.filter((row) => row.season === season);
    return (current.length > 0 ? current : data).flatMap((row) => {
      const race = fromStoredRow(row);
      return race ? [race] : [];
    });
  } catch (error) {
    console.error("Stored F1 races unavailable:", error);
    return [];
  }
}

function fromStoredRow(row: {
  id: string;
  season: number;
  name: string;
  circuit: string | null;
  date: string;
  status: string | null;
  winner: Json | null;
  sessions: Json | null;
}): F1RaceCardData | null {
  const id = textOrNull(row.id);
  const name = textOrNull(row.name);
  const date = textOrNull(row.date);
  if (!id || !name || !date || Number.isNaN(Date.parse(date))) {
    return null;
  }

  const winner = readWinner(row.winner);
  return {
    id,
    season: row.season,
    name,
    circuitName: textOrNull(row.circuit) ?? "Circuit",
    circuitImage: null,
    country: null,
    startsAt: date,
    status: textOrNull(row.status) ?? "Scheduled",
    winnerDriver: winner.driver,
    winnerTeam: winner.team,
    winnerDriverImage: winner.image,
    drivers: winner.driver ? [winner.driver] : [],
    sessions: readSessions(row.sessions),
    userRating: null,
  };
}

function readWinner(value: Json | null): {
  driver: string | null;
  team: string | null;
  image: string | null;
} {
  const record = asRecord(value);
  return {
    driver: jsonText(record?.driver),
    team: jsonText(record?.team),
    image: jsonText(record?.image),
  };
}

function readSessions(value: Json | null): F1RaceCardData["sessions"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const record = asRecord(entry);
    const id = jsonText(record?.id);
    const startsAt = jsonText(record?.startsAt);
    if (!id || !startsAt || Number.isNaN(Date.parse(startsAt))) {
      return [];
    }
    return [
      {
        id,
        type: jsonText(record?.type) ?? "Session",
        label: jsonText(record?.label) ?? jsonText(record?.type) ?? "Session",
        startsAt,
        status: jsonText(record?.status) ?? "Scheduled",
      },
    ];
  });
}

function asRecord(value: Json | null | undefined): { [key: string]: Json | undefined } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function jsonText(value: Json | undefined): string | null {
  return typeof value === "string" ? textOrNull(value) : null;
}

function groupRaces(races: F1RaceCardData[]): F1RaceListing {
  const completed = races
    .filter((race) => isCompletedRace(race))
    .sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
  const upcoming = races
    .filter((race) => !isCompletedRace(race))
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  const season =
    races.find((race) => race.season === new Date().getFullYear())?.season ??
    races[0]?.season ??
    new Date().getFullYear();

  return { season, completed, upcoming };
}

function isCompletedRace(race: F1RaceCardData): boolean {
  if (/complete|finished/i.test(race.status)) {
    return true;
  }
  if (/scheduled|upcoming|not started/i.test(race.status)) {
    return false;
  }
  return new Date(race.startsAt).getTime() <= Date.now();
}

function shouldUseStoredRaces(error: unknown): boolean {
  if (error instanceof F1SeasonUnavailableError) {
    return true;
  }
  if (error instanceof Error && error.name === "F1SeasonUnavailableError") {
    return true;
  }
  return isPlanError(error) || isRateLimitError(error);
}

function isMissingTable(message: string) {
  return /f1_races|f1_race_ratings|schema cache|does not exist/i.test(message);
}
