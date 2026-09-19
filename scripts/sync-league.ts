import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * One-time / on-demand backfill of Football-Data.org fixtures into Supabase.
 *
 * Usage:
 *   npm run sync:laliga
 *   npm run sync:pl
 *   npm run sync:all
 *   npx tsx scripts/sync-league.ts PL
 *   npx tsx scripts/sync-league.ts PD 2024
 */

async function main() {
  const competitionCode = process.argv[2] || "PL";
  const season = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;
  if (season !== undefined && Number.isNaN(season)) {
    throw new Error(`Invalid season: ${process.argv[3]}`);
  }

  const { syncCompetitionMatches } = await import("@/lib/sports-data/sync");

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
