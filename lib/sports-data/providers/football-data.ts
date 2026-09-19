import type { SportsDataProvider } from "@/lib/sports-data/provider";
import type {
  CompetitionMatches,
  ExternalCompetition,
  ExternalMatch,
  ExternalMatchStatus,
  ExternalTeam,
} from "@/lib/sports-data/types";

const BASE_URL = "https://api.football-data.org/v4";

type FootballDataTeam = {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
};

type FootballDataCompetition = {
  id: number;
  name: string;
  code?: string | null;
  emblem?: string | null;
  area?: { name?: string | null } | null;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  area?: { name?: string | null } | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    } | null;
  } | null;
};

type FootballDataMatchesResponse = {
  competition: FootballDataCompetition;
  matches?: FootballDataMatch[];
};

function getApiKey(): string {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    throw new Error(
      "Missing FOOTBALL_DATA_API_KEY. Add it to .env.local (never expose it to the browser).",
    );
  }
  return key;
}

function mapStatus(status: string): ExternalMatchStatus {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "scheduled";
    case "IN_PLAY":
    case "PAUSED":
      return "in_play";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    case "POSTPONED":
    case "SUSPENDED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function normalizeTeam(team: FootballDataTeam): ExternalTeam {
  return {
    externalId: String(team.id),
    name: team.name,
    shortName: team.shortName ?? team.tla ?? undefined,
    crestUrl: team.crest ?? undefined,
  };
}

function normalizeCompetition(
  competition: FootballDataCompetition,
  country?: string,
): ExternalCompetition {
  return {
    externalId: String(competition.id),
    name: competition.name,
    shortName: competition.code ?? undefined,
    country,
    logoUrl: competition.emblem ?? undefined,
  };
}

function normalizeMatch(
  match: FootballDataMatch,
  competition: ExternalCompetition,
): ExternalMatch {
  const homeTeam = normalizeTeam(match.homeTeam);
  const awayTeam = normalizeTeam(match.awayTeam);
  const homeScore = match.score?.fullTime?.home ?? null;
  const awayScore = match.score?.fullTime?.away ?? null;

  return {
    externalId: String(match.id),
    competitionExternalId: competition.externalId,
    homeTeamExternalId: homeTeam.externalId,
    awayTeamExternalId: awayTeam.externalId,
    kickoffAt: match.utcDate,
    status: mapStatus(match.status),
    homeScore,
    awayScore,
    homeTeam,
    awayTeam,
  };
}

async function footballDataGet(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<FootballDataMatchesResponse> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": getApiKey(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Football-Data.org request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  return (await response.json()) as FootballDataMatchesResponse;
}

function toCompetitionMatches(
  payload: FootballDataMatchesResponse,
): CompetitionMatches {
  if (!payload.competition?.id) {
    throw new Error("Football-Data.org response was missing a competition.");
  }

  const country =
    payload.competition.area?.name ??
    payload.matches?.find((match) => match.area?.name)?.area?.name ??
    undefined;

  const competition = normalizeCompetition(payload.competition, country);

  const matches = (payload.matches ?? []).flatMap((match) => {
    if (!match?.id || !match.utcDate || !match.homeTeam?.id || !match.awayTeam?.id) {
      return [];
    }
    return [normalizeMatch(match, competition)];
  });

  return { competition, matches };
}

async function fetchCompetitionMatches(
  competitionCode: string,
  season?: number,
): Promise<CompetitionMatches> {
  // Omit ?season= when unset so Football-Data.org uses the active calendar season.
  const params: Record<string, string | number | undefined> = {};
  if (season != null && Number.isFinite(season)) {
    params.season = season;
  }

  const payload = await footballDataGet(
    `/competitions/${encodeURIComponent(competitionCode)}/matches`,
    params,
  );
  return toCompetitionMatches(payload);
}

async function fetchRecentMatches(
  competitionCode: string,
  dateFrom: string,
  dateTo: string,
): Promise<CompetitionMatches> {
  const payload = await footballDataGet(
    `/competitions/${encodeURIComponent(competitionCode)}/matches`,
    {
      dateFrom: dateFrom.trim(),
      dateTo: dateTo.trim(),
    },
  );
  return toCompetitionMatches(payload);
}

export const footballDataProvider: SportsDataProvider = {
  fetchCompetitionMatches,
  fetchRecentMatches,
};
