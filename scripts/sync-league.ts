import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * One-time / on-demand backfill of Football-Data.org fixtures into Supabase.
 *
 * Usage:
 *   npm run sync:pl
 *   npm run sync:laliga
 *   npm run sync:cl
 *   npm run sync:all
 *   npx tsx scripts/sync-league.ts PL
 *   npx tsx scripts/sync-league.ts PD 2024
 *   npx tsx scripts/sync-league.ts ALL
 */

function summarize(
  results: Array<{
    competitionCode: string;
    matchesUpserted: number;
    teamsUpserted: number;
  }>,
) {
  const matchesUpserted = results.reduce(
    (total, result) => total + result.matchesUpserted,
    0,
  );
  const teamsUpserted = results.reduce(
    (total, result) => total + result.teamsUpserted,
    0,
  );

  for (const result of results) {
    console.log(
      `${result.competitionCode}: ${result.matchesUpserted} matches, ${result.teamsUpserted} teams`,
    );
  }
  console.log(
    `Total: ${matchesUpserted} matches and ${teamsUpserted} teams across ${results.length} competitions.`,
  );
}

async function main() {
  const code = process.argv[2]?.toUpperCase();
  const season = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;
  if (season !== undefined && Number.isNaN(season)) {
    throw new Error(`Invalid season: ${process.argv[3]}`);
  }

  const { syncAllLeagues, syncCompetitionMatches } = await import(
    "@/lib/sports-data/sync"
  );

  if (code === "ALL") {
    console.log(
      season == null
        ? "Syncing all supported leagues (current season)…"
        : `Syncing all supported leagues for season ${season}…`,
    );
    summarize(await syncAllLeagues(season));
    return;
  }

  const competitionCode = code || "PL";
  console.log(
    season == null
      ? `Syncing ${competitionCode} (current season)…`
      : `Syncing ${competitionCode} season ${season}…`,
  );
  const result = await syncCompetitionMatches(competitionCode, season);
  console.log(
    `Upserted ${result.matchesUpserted} matches and ${result.teamsUpserted} teams (competition ${result.competitionId}).`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
