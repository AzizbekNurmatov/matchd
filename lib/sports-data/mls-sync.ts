import { fetchLeagueFixtures } from "@/lib/sports-data/providers/api-sports-football";
import { upsertCompetitionMatches } from "@/lib/sports-data/sync";
import type {
  CompetitionMatches,
  ExternalMatchStatus,
} from "@/lib/sports-data/types";

export const MLS_LEAGUE_ID = 253;
export const MLS_SEASON = 2026;

function mapStatus(short: string | null | undefined): ExternalMatchStatus {
  switch ((short ?? "").toUpperCase()) {
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "LIVE":
    case "INT":
      return "in_play";
    case "FT":
    case "AET":
    case "PEN":
    case "AWD":
    case "WO":
      return "finished";
    case "PST":
    case "SUSP":
      return "postponed";
    case "CANC":
    case "ABD":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function isSeasonPlanError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /do not have access to this season|try from 2022 to 2024/i.test(message);
}

async function syncSeason(season: number) {
  const fixtures = await fetchLeagueFixtures(MLS_LEAGUE_ID, season);
  const league = fixtures[0]?.league;
  const payload: CompetitionMatches = {
    competition: {
      externalId: `apisports-league-${MLS_LEAGUE_ID}`,
      name: league?.name?.trim() || "Major League Soccer",
      shortName: "MLS",
      country: league?.country ?? "USA",
      logoUrl: league?.logo ?? undefined,
    },
    matches: fixtures.flatMap((fixture) => {
      const home = fixture.teams?.home;
      const away = fixture.teams?.away;
      if (!fixture.fixture?.id || !fixture.fixture.date || !home?.id || !away?.id) {
        return [];
      }
      if (home.id === away.id) {
        return [];
      }

      const homeScore = fixture.goals?.home ?? fixture.score?.fulltime?.home ?? null;
      const awayScore = fixture.goals?.away ?? fixture.score?.fulltime?.away ?? null;

      return [
        {
          externalId: `apisports-fixture-${fixture.fixture.id}`,
          competitionExternalId: `apisports-league-${MLS_LEAGUE_ID}`,
          homeTeamExternalId: `apisports-team-${home.id}`,
          awayTeamExternalId: `apisports-team-${away.id}`,
          kickoffAt: fixture.fixture.date,
          status: mapStatus(fixture.fixture.status?.short),
          homeScore,
          awayScore,
          homeTeam: {
            externalId: `apisports-team-${home.id}`,
            name: home.name,
            crestUrl: home.logo ?? undefined,
            country: "USA",
          },
          awayTeam: {
            externalId: `apisports-team-${away.id}`,
            name: away.name,
            crestUrl: away.logo ?? undefined,
            country: "USA",
          },
        },
      ];
    }),
  };

  return { ...(await upsertCompetitionMatches("MLS", payload)), season };
}

export async function syncMlsSeason(season = MLS_SEASON) {
  try {
    return await syncSeason(season);
  } catch (error) {
    if (season !== 2024 && isSeasonPlanError(error)) {
      console.warn(
        `MLS season ${season} is outside the API-Sports plan. Syncing 2024 instead.`,
      );
      return syncSeason(2024);
    }
    throw error;
  }
}
