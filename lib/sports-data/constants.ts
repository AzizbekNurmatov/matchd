export const SUPPORTED_LEAGUES = [
  { code: "PL", name: "Premier League", country: "England" },
  { code: "PD", name: "La Liga", country: "Spain" },
  { code: "CL", name: "UEFA Champions League", country: "Europe" },
  { code: "BL1", name: "Bundesliga", country: "Germany" },
  { code: "SA", name: "Serie A", country: "Italy" },
  { code: "FL1", name: "Ligue 1", country: "France" },
] as const;

export type SupportedLeagueCode = (typeof SUPPORTED_LEAGUES)[number]["code"];

export function isSupportedLeagueCode(
  value: string,
): value is SupportedLeagueCode {
  return SUPPORTED_LEAGUES.some((league) => league.code === value);
}
