import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { syncRecentUfcEvents } from "@/lib/ufc/sync";

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
    const result = await syncRecentUfcEvents();
    revalidatePath("/");

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UFC sync failed";
    console.error("UFC cron sync failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
