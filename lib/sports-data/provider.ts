import type { CompetitionMatches } from "@/lib/sports-data/types";

/**
 * Boundary for the soccer stats API.
 * UI code should never depend on this — only a server-side sync job.
 */
export interface SportsDataProvider {
  fetchCompetitionMatches(
    competitionCode: string,
    season?: number,
  ): Promise<CompetitionMatches>;
  fetchRecentMatches(
    competitionCode: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<CompetitionMatches>;
}
