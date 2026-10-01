import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { seedMlsFixtures } from "@/lib/sports-data/mls-seed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return (
    request.headers.get("authorization") ===
    `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedMlsFixtures();
    revalidateTag("matches", { expire: 0 });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MLS seed failed";
    console.error("MLS seed failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
