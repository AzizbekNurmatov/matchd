export type ExternalMatchStatus =
  | "scheduled"
  | "live"
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
};
