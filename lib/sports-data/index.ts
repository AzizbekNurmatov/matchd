import "server-only";

import { mockSportsDataProvider } from "@/lib/sports-data/mock";
import type { SportsDataProvider } from "@/lib/sports-data/provider";

/**
 * Server-only access to the sports-data provider.
 *
 * Pages should read matches from Postgres. A later sync job will call this,
 * map the provider shapes onto our tables, and write with the service role.
 */
export function getSportsDataProvider(): SportsDataProvider {
  return mockSportsDataProvider;
}

export type { SportsDataProvider } from "@/lib/sports-data/provider";
export type {
  ExternalCompetition,
  ExternalMatch,
  ExternalMatchStatus,
  ExternalTeam,
} from "@/lib/sports-data/types";
