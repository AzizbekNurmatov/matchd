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
    externalId: "pd",
    name: "La Liga",
    shortName: "PD",
    country: "Spain",
  },
];

const teams: Record<string, ExternalTeam> = {
  ars: { externalId: "ars", name: "Arsenal", shortName: "ARS", country: "England" },
  liv: {
    externalId: "liv",
    name: "Liverpool",
    shortName: "LIV",
    country: "England",
  },
  mci: {
    externalId: "mci",
    name: "Manchester City",
    shortName: "MCI",
    country: "England",
  },
  rma: {
    externalId: "rma",
    name: "Real Madrid",
    shortName: "RMA",
    country: "Spain",
  },
  bar: {
    externalId: "bar",
    name: "FC Barcelona",
    shortName: "BAR",
    country: "Spain",
  },
};

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
    homeTeam: teams.ars,
    awayTeam: teams.liv,
  },
  {
    externalId: "pd-001",
    competitionExternalId: "pd",
    homeTeamExternalId: "bar",
    awayTeamExternalId: "rma",
    kickoffAt: "2026-04-15T19:00:00.000Z",
    status: "finished",
    homeScore: 1,
    awayScore: 3,
    homeTeam: teams.bar,
    awayTeam: teams.rma,
  },
];

function payloadFor(
  competitionCode: string,
  filter?: (match: ExternalMatch) => boolean,
) {
  const code = competitionCode.toLowerCase();
  const competition =
    competitions.find(
      (item) =>
        item.shortName?.toLowerCase() === code ||
        item.externalId.toLowerCase() === code,
    ) ?? competitions[0];

  return {
    competition,
    matches: matches.filter((match) => {
      const belongsToCompetition =
        match.competitionExternalId === competition.externalId;
      return belongsToCompetition && (filter ? filter(match) : true);
    }),
  };
}

export const mockSportsDataProvider: SportsDataProvider = {
  async fetchCompetitionMatches(competitionCode) {
    return payloadFor(competitionCode);
  },
  async fetchRecentMatches(competitionCode, dateFrom, dateTo) {
    const from = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
    const to = new Date(`${dateTo}T23:59:59.999Z`).getTime();
    return payloadFor(competitionCode, (match) => {
      const kickoff = new Date(match.kickoffAt).getTime();
      return kickoff >= from && kickoff <= to;
    });
  },
};
