import { footballDataProvider } from "@/lib/sports-data/providers/football-data";
import type {
  CompetitionMatches,
  ExternalMatchStatus,
  ExternalTeam,
} from "@/lib/sports-data/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MatchStatus } from "@/types/database";

const MATCH_UPSERT_CHUNK = 100;

export type SyncResult = {
  competitionCode: string;
  competitionId: string;
  teamsUpserted: number;
  matchesUpserted: number;
};

function toDatabaseStatus(status: ExternalMatchStatus): MatchStatus {
  if (status === "in_play") {
    return "live";
  }
  return status;
}

function pairedScores(
  homeScore: number | null,
  awayScore: number | null,
): { home_score: number | null; away_score: number | null } {
  if (homeScore === null || awayScore === null) {
    return { home_score: null, away_score: null };
  }
  return { home_score: homeScore, away_score: awayScore };
}

function uniqueTeams(matches: CompetitionMatches["matches"]): ExternalTeam[] {
  const byExternalId = new Map<string, ExternalTeam>();
  for (const match of matches) {
    byExternalId.set(match.homeTeam.externalId, match.homeTeam);
    byExternalId.set(match.awayTeam.externalId, match.awayTeam);
  }
  return [...byExternalId.values()];
}

async function upsertCompetitionMatches(
  competitionCode: string,
  payload: CompetitionMatches,
): Promise<SyncResult> {
  const supabase = createAdminClient();
  const { competition, matches } = payload;

  const { data: competitionRow, error: competitionError } = await supabase
    .from("competitions")
    .upsert(
      {
        external_id: competition.externalId,
        name: competition.name,
        short_name: competition.shortName ?? null,
        country: competition.country ?? null,
        logo_url: competition.logoUrl ?? null,
      },
      { onConflict: "external_id" },
    )
    .select("id")
    .single();

  if (competitionError || !competitionRow) {
    throw new Error(
      `Failed to upsert competition ${competitionCode}: ${competitionError?.message ?? "no row returned"}`,
    );
  }

  const teams = uniqueTeams(matches);
  if (teams.length > 0) {
    const { error: teamsError } = await supabase.from("teams").upsert(
      teams.map((team) => ({
        external_id: team.externalId,
        name: team.name,
        short_name: team.shortName ?? null,
        crest_url: team.crestUrl ?? null,
        country: team.country ?? null,
      })),
      { onConflict: "external_id" },
    );

    if (teamsError) {
      throw new Error(`Failed to upsert teams: ${teamsError.message}`);
    }
  }

  const teamExternalIds = teams.map((team) => team.externalId);
  const teamIdByExternalId = new Map<string, string>();

  if (teamExternalIds.length > 0) {
    const { data: teamRows, error: teamQueryError } = await supabase
      .from("teams")
      .select("id, external_id")
      .in("external_id", teamExternalIds);

    if (teamQueryError) {
      throw new Error(
        `Failed to load team IDs for ${competitionCode}: ${teamQueryError.message}`,
      );
    }

    for (const row of teamRows ?? []) {
      if (row.external_id) {
        teamIdByExternalId.set(row.external_id, row.id);
      }
    }
  }

  const matchRows = [];
  for (const match of matches) {
    const homeTeamId = teamIdByExternalId.get(match.homeTeamExternalId);
    const awayTeamId = teamIdByExternalId.get(match.awayTeamExternalId);
    if (!homeTeamId || !awayTeamId) {
      throw new Error(
        `Missing team UUID for match ${match.externalId} (${match.homeTeamExternalId} vs ${match.awayTeamExternalId})`,
      );
    }

    matchRows.push({
      external_id: match.externalId,
      competition_id: competitionRow.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      kickoff_at: match.kickoffAt,
      status: toDatabaseStatus(match.status),
      ...pairedScores(match.homeScore, match.awayScore),
    });
  }

  for (let index = 0; index < matchRows.length; index += MATCH_UPSERT_CHUNK) {
    const chunk = matchRows.slice(index, index + MATCH_UPSERT_CHUNK);
    const { error: matchesError } = await supabase
      .from("matches")
      .upsert(chunk, { onConflict: "external_id" });

    if (matchesError) {
      throw new Error(`Failed to upsert matches: ${matchesError.message}`);
    }
  }

  return {
    competitionCode,
    competitionId: competitionRow.id,
    teamsUpserted: teams.length,
    matchesUpserted: matchRows.length,
  };
}

export async function syncCompetitionMatches(
  competitionCode: string,
  season?: number,
): Promise<SyncResult> {
  const payload = await footballDataProvider.fetchCompetitionMatches(
    competitionCode,
    season,
  );
  return upsertCompetitionMatches(competitionCode, payload);
}

export async function syncRecentMatches(
  competitionCode: string,
  dateFrom: string,
  dateTo: string,
): Promise<SyncResult> {
  const payload = await footballDataProvider.fetchRecentMatches(
    competitionCode,
    dateFrom,
    dateTo,
  );
  return upsertCompetitionMatches(competitionCode, payload);
}
