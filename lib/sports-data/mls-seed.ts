import { createAdminClient } from "@/lib/supabase/admin";
import type { MatchStatus } from "@/types/database";

const COMPETITION_EXTERNAL_ID = "apisports-league-253";

type SeedTeam = {
  key: string;
  name: string;
  lookup: string;
  shortName: string;
  crestUrl: string;
};

type SeedMatch = {
  externalId: string;
  home: string;
  away: string;
  kickoffAt: string;
  status: Extract<MatchStatus, "finished" | "scheduled">;
  homeScore: number | null;
  awayScore: number | null;
};

const TEAMS: SeedTeam[] = [
  {
    key: "miami",
    name: "Inter Miami CF",
    lookup: "Inter Miami",
    shortName: "MIA",
    crestUrl: "https://media.api-sports.io/football/teams/9568.png",
  },
  {
    key: "columbus",
    name: "Columbus Crew",
    lookup: "Columbus Crew",
    shortName: "CLB",
    crestUrl: "https://media.api-sports.io/football/teams/1613.png",
  },
  {
    key: "philadelphia",
    name: "Philadelphia Union",
    lookup: "Philadelphia Union",
    shortName: "PHI",
    crestUrl: "https://media.api-sports.io/football/teams/1599.png",
  },
  {
    key: "orlando",
    name: "Orlando City SC",
    lookup: "Orlando City",
    shortName: "ORL",
    crestUrl: "https://media.api-sports.io/football/teams/1598.png",
  },
  {
    key: "seattle",
    name: "Seattle Sounders",
    lookup: "Seattle Sounders",
    shortName: "SEA",
    crestUrl: "https://media.api-sports.io/football/teams/1595.png",
  },
  {
    key: "galaxy",
    name: "LA Galaxy",
    lookup: "Los Angeles Galaxy",
    shortName: "LAG",
    crestUrl: "https://media.api-sports.io/football/teams/1605.png",
  },
  {
    key: "dc",
    name: "D.C. United",
    lookup: "DC United",
    shortName: "DC",
    crestUrl: "https://media.api-sports.io/football/teams/1615.png",
  },
  {
    key: "nycfc",
    name: "New York City FC",
    lookup: "New York City FC",
    shortName: "NYC",
    crestUrl: "https://media.api-sports.io/football/teams/1604.png",
  },
  {
    key: "atlanta",
    name: "Atlanta United FC",
    lookup: "Atlanta United",
    shortName: "ATL",
    crestUrl: "https://media.api-sports.io/football/teams/1608.png",
  },
  {
    key: "rsl",
    name: "Real Salt Lake",
    lookup: "Real Salt Lake",
    shortName: "RSL",
    crestUrl: "https://media.api-sports.io/football/teams/1606.png",
  },
  {
    key: "new-england",
    name: "New England Revolution",
    lookup: "New England Revolution",
    shortName: "NE",
    crestUrl: "https://media.api-sports.io/football/teams/1609.png",
  },
  {
    key: "colorado",
    name: "Colorado Rapids",
    lookup: "Colorado Rapids",
    shortName: "COL",
    crestUrl: "https://media.api-sports.io/football/teams/1610.png",
  },
  {
    key: "portland",
    name: "Portland Timbers",
    lookup: "Portland Timbers",
    shortName: "POR",
    crestUrl: "https://media.api-sports.io/football/teams/1617.png",
  },
  {
    key: "stl",
    name: "St. Louis CITY SC",
    lookup: "St. Louis",
    shortName: "STL",
    crestUrl: "https://media.api-sports.io/football/teams/20787.png",
  },
  {
    key: "minnesota",
    name: "Minnesota United FC",
    lookup: "Minnesota United",
    shortName: "MIN",
    crestUrl: "https://media.api-sports.io/football/teams/1612.png",
  },
  {
    key: "lafc",
    name: "Los Angeles FC",
    lookup: "Los Angeles FC",
    shortName: "LAFC",
    crestUrl: "https://media.api-sports.io/football/teams/1616.png",
  },
];

const MATCHES: SeedMatch[] = [
  {
    externalId: "mls-2026-phi-orl",
    home: "philadelphia",
    away: "orlando",
    kickoffAt: "2026-09-26T23:30:00.000Z",
    status: "finished",
    homeScore: 4,
    awayScore: 2,
  },
  {
    externalId: "mls-2026-sea-min",
    home: "seattle",
    away: "minnesota",
    kickoffAt: "2026-09-27T02:30:00.000Z",
    status: "finished",
    homeScore: 3,
    awayScore: 1,
  },
  {
    externalId: "mls-2026-lag-col",
    home: "galaxy",
    away: "colorado",
    kickoffAt: "2026-09-27T02:30:00.000Z",
    status: "finished",
    homeScore: 3,
    awayScore: 2,
  },
  {
    externalId: "mls-2026-clb-mia",
    home: "columbus",
    away: "miami",
    kickoffAt: "2026-09-27T23:00:00.000Z",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
  },
  {
    externalId: "mls-2026-mia-dc",
    home: "miami",
    away: "dc",
    kickoffAt: "2026-10-10T23:30:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-orl-clb",
    home: "orlando",
    away: "columbus",
    kickoffAt: "2026-10-10T23:30:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-phi-rsl",
    home: "philadelphia",
    away: "rsl",
    kickoffAt: "2026-10-10T23:30:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-ne-sea",
    home: "new-england",
    away: "seattle",
    kickoffAt: "2026-10-10T23:30:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-stl-lag",
    home: "stl",
    away: "galaxy",
    kickoffAt: "2026-10-11T23:00:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-mia-nyc",
    home: "miami",
    away: "nycfc",
    kickoffAt: "2026-10-15T02:30:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-lag-por",
    home: "galaxy",
    away: "portland",
    kickoffAt: "2026-10-15T05:30:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-atl-mia",
    home: "atlanta",
    away: "miami",
    kickoffAt: "2026-10-17T23:30:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    externalId: "mls-2026-lafc-lag",
    home: "lafc",
    away: "galaxy",
    kickoffAt: "2026-10-26T04:00:00.000Z",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
];

export async function seedMlsFixtures() {
  const supabase = createAdminClient();

  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .upsert(
      {
        external_id: COMPETITION_EXTERNAL_ID,
        name: "Major League Soccer",
        short_name: "MLS",
        country: "USA",
        logo_url: "https://media.api-sports.io/football/leagues/253.png",
      },
      { onConflict: "external_id" },
    )
    .select("id")
    .single();

  if (competitionError || !competition) {
    throw new Error(
      `Failed to upsert MLS competition: ${competitionError?.message ?? "no row"}`,
    );
  }

  const teamIds = new Map<string, string>();

  for (const team of TEAMS) {
    const { data: existing, error: lookupError } = await supabase
      .from("teams")
      .select("id, name, crest_url")
      .ilike("name", `%${team.lookup}%`)
      .limit(5);

    if (lookupError) {
      throw new Error(`Failed to look up ${team.name}: ${lookupError.message}`);
    }

    const found = (existing ?? []).find((row) =>
      row.name.toLowerCase().includes(team.lookup.toLowerCase()),
    );

    if (found) {
      if (!found.crest_url) {
        await supabase
          .from("teams")
          .update({ crest_url: team.crestUrl, short_name: team.shortName })
          .eq("id", found.id);
      }
      teamIds.set(team.key, found.id);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("teams")
      .upsert(
        {
          external_id: `mls-seed-${team.key}`,
          name: team.name,
          short_name: team.shortName,
          crest_url: team.crestUrl,
          country: "USA",
        },
        { onConflict: "external_id" },
      )
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(
        `Failed to upsert ${team.name}: ${insertError?.message ?? "no row"}`,
      );
    }
    teamIds.set(team.key, inserted.id);
  }

  const rows = MATCHES.map((match) => {
    const homeTeamId = teamIds.get(match.home);
    const awayTeamId = teamIds.get(match.away);
    if (!homeTeamId || !awayTeamId) {
      throw new Error(`Missing team id for ${match.externalId}`);
    }
    return {
      external_id: match.externalId,
      competition_id: competition.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      kickoff_at: match.kickoffAt,
      status: match.status,
      home_score: match.homeScore,
      away_score: match.awayScore,
    };
  });

  const { error: matchesError } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "external_id" });

  if (matchesError) {
    throw new Error(`Failed to upsert MLS matches: ${matchesError.message}`);
  }

  return {
    competitionId: competition.id,
    teams: teamIds.size,
    matchesSeeded: rows.length,
    finished: rows.filter((row) => row.status === "finished").length,
    scheduled: rows.filter((row) => row.status === "scheduled").length,
  };
}
