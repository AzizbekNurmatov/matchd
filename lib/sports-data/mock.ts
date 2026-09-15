import type { SportsDataProvider } from "@/lib/sports-data/provider";
import type {
  ExternalCompetition,
  ExternalMatch,
  ExternalTeam,
} from "@/lib/sports-data/types";

const competitions: ExternalCompetition[] = [
  {
    externalId: "pl",
    name: "Premier League",
    shortName: "PL",
    country: "England",
  },
  {
    externalId: "ucl",
    name: "UEFA Champions League",
    shortName: "UCL",
    country: "Europe",
  },
];

const teams: ExternalTeam[] = [
  { externalId: "ars", name: "Arsenal", shortName: "ARS", country: "England" },
  {
    externalId: "liv",
    name: "Liverpool",
    shortName: "LIV",
    country: "England",
  },
  {
    externalId: "mci",
    name: "Manchester City",
    shortName: "MCI",
    country: "England",
  },
  {
    externalId: "rma",
    name: "Real Madrid",
    shortName: "RMA",
    country: "Spain",
  },
];

const matches: ExternalMatch[] = [
  {
    externalId: "pl-001",
    competitionExternalId: "pl",
    homeTeamExternalId: "ars",
    awayTeamExternalId: "liv",
    kickoffAt: "2026-04-12T15:30:00.000Z",
    status: "finished",
    homeScore: 2,
    awayScore: 2,
  },
  {
    externalId: "ucl-001",
    competitionExternalId: "ucl",
    homeTeamExternalId: "mci",
    awayTeamExternalId: "rma",
    kickoffAt: "2026-04-15T19:00:00.000Z",
    status: "finished",
    homeScore: 1,
    awayScore: 3,
  },
];

export const mockSportsDataProvider: SportsDataProvider = {
  async listCompetitions() {
    return competitions;
  },
  async listTeams() {
    return teams;
  },
  async listRecentMatches() {
    return matches;
  },
  async getMatch(externalId) {
    return matches.find((match) => match.externalId === externalId) ?? null;
  },
};
