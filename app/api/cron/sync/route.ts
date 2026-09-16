import { NextResponse } from "next/server";
import { syncRecentMatches } from "@/lib/sports-data/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const WINDOW_DAYS = 2;
const COMPETITION_CODE = "PD";
const MS_PER_DAY = 86_400_000;

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (secret) {
    return header === `Bearer ${secret}`;
  }

  // Optional protection: require a secret in production, allow local curl without one.
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const dateFrom = isoDate(now - WINDOW_DAYS * MS_PER_DAY);
  const dateTo = isoDate(now + WINDOW_DAYS * MS_PER_DAY);

  try {
    const result = await syncRecentMatches(COMPETITION_CODE, dateFrom, dateTo);
    return NextResponse.json({
      ok: true,
      dateFrom,
      dateTo,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("Cron sync failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
