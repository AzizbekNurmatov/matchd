import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * One-time / on-demand backfill of Football-Data.org fixtures into Supabase.
 *
 * Usage:
 *   npm run sync:laliga
 *   npx tsx --env-file=.env.local scripts/sync-league.ts PD 2024
 */

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  let text: string;
  try {
    text = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  const competitionCode = process.argv[2] ?? "PD";
  const seasonArg = process.argv[3];
  const season = seasonArg ? Number(seasonArg) : 2024;
  if (Number.isNaN(season)) {
    throw new Error(`Invalid season: ${seasonArg}`);
  }

  const { syncCompetitionMatches } = await import("@/lib/sports-data/sync");

  console.log(`Syncing ${competitionCode} season ${season}…`);
  const result = await syncCompetitionMatches(competitionCode, season);
  console.log(
    `Upserted ${result.matchesUpserted} matches and ${result.teamsUpserted} teams (competition ${result.competitionId}).`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
