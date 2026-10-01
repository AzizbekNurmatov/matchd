import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { MLS_LEAGUE_ID, MLS_SEASON, syncMlsSeason } from "@/lib/sports-data/mls-sync";

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
    const result = await syncMlsSeason();
    revalidateTag("matches", { expire: 0 });

    return NextResponse.json({
      ok: true,
      league: MLS_LEAGUE_ID,
      season: MLS_SEASON,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MLS seed failed";
    console.error("MLS seed failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
