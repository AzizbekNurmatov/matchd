import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { fetchSeasonCalendar } from "@/lib/f1/calendar";

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
    const races = await fetchSeasonCalendar();
    revalidateTag("f1", "max");
    revalidatePath("/f1");
    revalidatePath("/search");
    return NextResponse.json({ ok: true, races: races.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "F1 sync failed";
    console.error("F1 cron sync failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
