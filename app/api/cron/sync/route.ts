import { NextResponse } from "next/server";
import { syncRecentMatchesAllLeagues } from "@/lib/sports-data/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !==
    "Bearer " + process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { dateFrom, dateTo, competitions } =
      await syncRecentMatchesAllLeagues();

    const matchesUpserted = competitions.reduce(
      (total, result) => total + result.matchesUpserted,
      0,
    );
    const teamsUpserted = competitions.reduce(
      (total, result) => total + result.teamsUpserted,
      0,
    );

    return NextResponse.json({
      ok: true,
      dateFrom,
      dateTo,
      matchesUpserted,
      teamsUpserted,
      competitions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("Cron sync failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
