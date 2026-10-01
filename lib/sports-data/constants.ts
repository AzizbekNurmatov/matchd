export const SUPPORTED_LEAGUES = [
  { code: "PL", name: "Premier League", country: "England" },
  { code: "PD", name: "La Liga", country: "Spain" },
  { code: "CL", name: "UEFA Champions League", country: "Europe" },
  { code: "BL1", name: "Bundesliga", country: "Germany" },
  { code: "SA", name: "Serie A", country: "Italy" },
  { code: "FL1", name: "Ligue 1", country: "France" },
  { code: "MLS", name: "MLS", country: "USA" },
] as const;

/** Leagues ingested from Football-Data.org. MLS uses API-Sports instead. */
export const FOOTBALL_DATA_LEAGUES = SUPPORTED_LEAGUES.filter(
  (league) => league.code !== "MLS",
);

export type SupportedLeagueCode = (typeof SUPPORTED_LEAGUES)[number]["code"];

/**
 * National-team competitions on the current Football-Data plan.
 * UEFA Nations League is not included in that plan, so it is not synced.
 */
export const INTERNATIONAL_COMPETITIONS = [
  { code: "WC", name: "FIFA World Cup", country: "World" },
  { code: "EC", name: "European Championship", country: "Europe" },
] as const;

export type InternationalCompetitionCode =
  (typeof INTERNATIONAL_COMPETITIONS)[number]["code"];

export function isSupportedLeagueCode(
  value: string,
): value is SupportedLeagueCode {
  return SUPPORTED_LEAGUES.some((league) => league.code === value);
}

export function isInternationalCompetitionCode(
  value: string,
): value is InternationalCompetitionCode {
  return INTERNATIONAL_COMPETITIONS.some(
    (competition) => competition.code === value,
  );
}

export function featuredCompetitionCodes(): string[] {
  return [
    ...SUPPORTED_LEAGUES.map((league) => league.code),
    ...INTERNATIONAL_COMPETITIONS.map((competition) => competition.code),
  ];
}
