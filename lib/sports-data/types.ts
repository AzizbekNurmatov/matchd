/**
 * Provider-normalized shapes for competitions, teams, and matches.
 * These are independent of both Football-Data.org payloads and Postgres rows.
 */

export type ExternalMatchStatus =
  | "scheduled"
  | "in_play"
  | "finished"
  | "postponed"
  | "cancelled";

export type ExternalCompetition = {
  externalId: string;
  name: string;
  shortName?: string;
  country?: string;
  logoUrl?: string;
};

export type ExternalTeam = {
  externalId: string;
  name: string;
  shortName?: string;
  crestUrl?: string;
  country?: string;
};

export type ExternalMatch = {
  externalId: string;
  competitionExternalId: string;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  kickoffAt: string;
  status: ExternalMatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: ExternalTeam;
  awayTeam: ExternalTeam;
};

export type CompetitionMatches = {
  competition: ExternalCompetition;
  matches: ExternalMatch[];
};

/** Normalized aliases used by the sports-data layer. */
export type Competition = ExternalCompetition;
export type Team = ExternalTeam;
export type Match = ExternalMatch;
