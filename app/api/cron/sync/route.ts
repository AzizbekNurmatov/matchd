import { NextResponse } from "next/server";
import { syncRecentMatches } from "@/lib/sports-data/sync";
import type { SyncResult } from "@/lib/sports-data/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const WINDOW_DAYS = 2;
const COMPETITION_CODES = ["PD", "PL"] as const;
const RATE_LIMIT_DELAY_MS = 500;
const MS_PER_DAY = 86_400_000;

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const competitions: SyncResult[] = [];

    for (const [index, code] of COMPETITION_CODES.entries()) {
      competitions.push(await syncRecentMatches(code, dateFrom, dateTo));
      if (index < COMPETITION_CODES.length - 1) {
        await delay(RATE_LIMIT_DELAY_MS);
      }
    }

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
