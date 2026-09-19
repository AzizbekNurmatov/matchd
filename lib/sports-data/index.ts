import { footballDataProvider } from "@/lib/sports-data/providers/football-data";
import type { SportsDataProvider } from "@/lib/sports-data/provider";

/**
 * Server-only access to the sports-data provider.
 *
 * Pages should read matches from Postgres. Sync jobs call the provider,
 * map the shapes onto our tables, and write with the service role.
 */
export function getSportsDataProvider(): SportsDataProvider {
  return footballDataProvider;
}

export type { SportsDataProvider } from "@/lib/sports-data/provider";
export type {
  Competition,
  CompetitionMatches,
  ExternalCompetition,
  ExternalMatch,
  ExternalMatchStatus,
  ExternalTeam,
  Match,
  Team,
} from "@/lib/sports-data/types";
