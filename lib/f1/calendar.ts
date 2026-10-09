import "server-only";

import {
  fetchRaceRankings,
  fetchRaces,
  isPlanError,
  respectRateLimit,
  type F1RaceRanking,
  type F1RaceSession,
} from "@/lib/f1/api";
import type { F1RaceCardData, F1Session } from "@/lib/f1/types";

const SESSION_LABELS: Record<string, string> = {
  "1st Practice": "Practice 1",
  "2nd Practice": "Practice 2",
  "3rd Practice": "Practice 3",
  "1st Qualifying": "Qualifying Q1",
  "2nd Qualifying": "Qualifying Q2",
  "3rd Qualifying": "Qualifying Q3",
  "Sprint Qualifying": "Sprint Qualifying",
  "Sprint Shootout": "Sprint Shootout",
  Race: "Race",
  Sprint: "Sprint",
};

export async function fetchSeasonCalendar(): Promise<F1RaceCardData[]> {
  const sessions = await fetchAccessibleSeason();
  const weekends = groupWeekends(sessions);
  await attachRankings(weekends);
  return weekends.sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );
}

async function fetchAccessibleSeason(): Promise<F1RaceSession[]> {
  const year = new Date().getUTCFullYear();
  const seasons = [...new Set([year, year - 1, 2024, 2023, 2022])];
  let lastError: unknown = null;

  for (const season of seasons) {
    try {
      await respectRateLimit();
      const rows = await fetchRaces({ season });
      if (rows.length > 0) {
        return rows;
      }
    } catch (error) {
      lastError = error;
      if (!isPlanError(error)) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
  return [];
}

function groupWeekends(rows: F1RaceSession[]): F1RaceCardData[] {
  const groups = new Map<string, F1RaceSession[]>();
  for (const row of rows) {
    const competitionId = row.competition?.id;
    if (competitionId == null || !row.date) {
      continue;
    }
    const key = `${row.season ?? "0"}:${competitionId}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const weekends: F1RaceCardData[] = [];
  for (const bucket of groups.values()) {
    const race = bucket.find((session) => session.type === "Race") ?? bucket[0];
    if (!race?.id || !race.date) {
      continue;
    }
    const sessions = bucket
      .filter((session) => session.date)
      .sort(
        (a, b) =>
          new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime(),
      )
      .map(toSession);

    weekends.push({
      id: String(race.id),
      season: race.season ?? new Date(race.date).getUTCFullYear(),
      name: race.competition?.name?.trim() || "Grand Prix",
      circuitName: race.circuit?.name?.trim() || "Circuit",
      circuitImage: race.circuit?.image ?? null,
      country: race.competition?.location?.country ?? null,
      startsAt: race.date,
      status: race.status?.trim() || "Scheduled",
      winnerDriver: null,
      winnerTeam: null,
      winnerDriverImage: null,
      drivers: [],
      sessions,
      userRating: null,
    });
  }

  return weekends;
}

function toSession(session: F1RaceSession): F1Session {
  const type = session.type?.trim() || "Session";
  return {
    id: String(session.id),
    type,
    label: SESSION_LABELS[type] ?? type,
    startsAt: session.date?.trim() || "",
    status: session.status?.trim() || "Scheduled",
  };
}

async function attachRankings(weekends: F1RaceCardData[]) {
  const completed = weekends.filter((race) => /complete|finished/i.test(race.status));

  for (const race of completed) {
    try {
      await respectRateLimit();
      const rankings = await fetchRaceRankings(Number(race.id));
      applyRankings(race, rankings);
    } catch (error) {
      console.error(`F1 rankings failed for race ${race.id}:`, error);
    }
  }
}

function applyRankings(race: F1RaceCardData, rankings: F1RaceRanking[]) {
  const names = rankings
    .map((row) => row.driver?.name?.trim())
    .filter((name): name is string => Boolean(name));
  race.drivers = [...new Set(names)];
  const winner = rankings.find((row) => row.position === 1);
  race.winnerDriver = winner?.driver?.name?.trim() || null;
  race.winnerTeam = winner?.team?.name?.trim() || null;
  race.winnerDriverImage = winner?.driver?.image ?? null;
}
