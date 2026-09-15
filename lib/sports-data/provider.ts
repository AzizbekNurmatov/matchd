import type {
  ExternalCompetition,
  ExternalMatch,
  ExternalTeam,
} from "@/lib/sports-data/types";

/**
 * Boundary for whatever soccer API we use later.
 * UI code should never depend on this — only a server-side sync job.
 */
export interface SportsDataProvider {
  listCompetitions(): Promise<ExternalCompetition[]>;
  listTeams(): Promise<ExternalTeam[]>;
  listRecentMatches(): Promise<ExternalMatch[]>;
  getMatch(externalId: string): Promise<ExternalMatch | null>;
}
