import {
  fetchFightResultsByDate,
  fetchFightsByDate,
  fetchSeasonFights,
  type MmaFight,
  type MmaFightResult,
} from "@/lib/ufc/mma-api";
import { createAdminClient } from "@/lib/supabase/admin";

const MS_PER_DAY = 86_400_000;
const LOOKBACK_DAYS = 10;
const LOOKAHEAD_DAYS = 14;
const MAIN_CARD_SIZE = 5;

export type UfcSyncResult = {
  eventsUpserted: number;
  fightsUpserted: number;
};

type BoutStatus = "UPCOMING" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";

function isUfcEvent(slug: string | null | undefined): slug is string {
  return typeof slug === "string" && /^ufc\b/i.test(slug.trim());
}

function mapStatus(status: MmaFight["status"]): BoutStatus {
  const label = `${status?.short ?? ""} ${status?.long ?? ""}`.toLowerCase();
  if (label.includes("finish") || /\bft\b/.test(label)) {
    return "FINISHED";
  }
  if (label.includes("live") || label.includes("progress") || label.includes("in play")) {
    return "LIVE";
  }
  if (label.includes("postpon")) {
    return "POSTPONED";
  }
  if (label.includes("cancel") || label.includes("canc")) {
    return "CANCELLED";
  }
  return "UPCOMING";
}

function eventStatus(fights: MmaFight[]): BoutStatus {
  const statuses = fights.map((fight) => mapStatus(fight.status));
  if (statuses.some((status) => status === "LIVE")) {
    return "LIVE";
  }
  if (statuses.length > 0 && statuses.every((status) => status === "FINISHED")) {
    return "FINISHED";
  }
  if (statuses.some((status) => status === "CANCELLED")) {
    return "CANCELLED";
  }
  if (statuses.some((status) => status === "POSTPONED")) {
    return "POSTPONED";
  }
  return "UPCOMING";
}

function winnerSide(
  fight: MmaFight,
  status: BoutStatus,
): "a" | "b" | "draw" | null {
  const first = fight.fighters?.first?.winner;
  const second = fight.fighters?.second?.winner;
  if (first === true && second !== true) {
    return "a";
  }
  if (second === true && first !== true) {
    return "b";
  }
  if (status === "FINISHED" && first === false && second === false) {
    return "draw";
  }
  return null;
}

function mainCard(fights: MmaFight[]): MmaFight[] {
  const mainIndex = fights.findIndex((fight) => fight.is_main);
  if (mainIndex < 0) {
    return fights.slice(-MAIN_CARD_SIZE);
  }
  if (mainIndex === 0) {
    return fights.slice(0, MAIN_CARD_SIZE).reverse();
  }
  const start = Math.max(0, mainIndex - (MAIN_CARD_SIZE - 1));
  return fights.slice(start, mainIndex + 1);
}

function eventId(slug: string, startsAt: string): string {
  const day = new Date(startsAt).toISOString().slice(0, 10);
  const base = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${base}-${day}`;
}

function dateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function resultForFight(results: MmaFightResult[], fightId: number) {
  return results.find((result) => (result.fight?.id ?? result.id) === fightId);
}

function resultMethod(result: MmaFightResult | undefined): string | null {
  return (
    result?.result?.won_type ??
    result?.result?.method ??
    result?.won_type ??
    result?.method ??
    null
  );
}

function resultRound(result: MmaFightResult | undefined): number | null {
  const round = result?.result?.round ?? result?.round;
  return typeof round === "number" && Number.isFinite(round) ? round : null;
}

function resultTime(result: MmaFightResult | undefined): string | null {
  return (
    result?.result?.time ??
    result?.result?.minute ??
    result?.result?.time_format ??
    result?.time ??
    result?.minute ??
    result?.time_format ??
    null
  );
}

async function loadFights(now: number): Promise<MmaFight[]> {
  const season = new Date(now).getUTCFullYear();
  const from = now - LOOKBACK_DAYS * MS_PER_DAY;
  const to = now + LOOKAHEAD_DAYS * MS_PER_DAY;

  let fights: MmaFight[] = [];
  try {
    fights = await fetchSeasonFights(season);
  } catch (error) {
    console.error("MMA season query failed, falling back to dates:", error);
  }

  const inWindow = fights.filter((fight) => {
    if (!fight.date || !isUfcEvent(fight.slug)) {
      return false;
    }
    const time = new Date(fight.date).getTime();
    return time >= from && time <= to;
  });

  if (inWindow.length > 0) {
    return inWindow;
  }

  const dated: MmaFight[] = [];
  for (let cursor = from; cursor <= to; cursor += MS_PER_DAY) {
    const date = new Date(cursor).toISOString().slice(0, 10);
    const day = await fetchFightsByDate(date);
    dated.push(
      ...day.filter((fight) => fight.date && isUfcEvent(fight.slug)),
    );
  }
  return dated;
}

export async function syncRecentUfcEvents(
  now = Date.now(),
): Promise<UfcSyncResult> {
  const fights = await loadFights(now);
  const byEvent = new Map<string, MmaFight[]>();

  for (const fight of fights) {
    if (!isUfcEvent(fight.slug) || !fight.id || !fight.date) {
      continue;
    }
    const key = fight.slug.trim();
    const group = byEvent.get(key) ?? [];
    group.push(fight);
    byEvent.set(key, group);
  }

  const dates = [
    ...new Set(
      fights
        .filter((fight) => fight.date && mapStatus(fight.status) === "FINISHED")
        .map((fight) => dateKey(fight.date!)),
    ),
  ];
  const results: MmaFightResult[] = [];
  for (const date of dates) {
    results.push(...(await fetchFightResultsByDate(date)));
  }

  const supabase = createAdminClient();
  let eventsUpserted = 0;
  let fightsUpserted = 0;

  for (const [slug, eventFights] of byEvent) {
    const card = mainCard(eventFights).filter(
      (fight) =>
        fight.fighters?.first?.name && fight.fighters?.second?.name,
    );
    if (card.length === 0) {
      continue;
    }

    const startsAt = card
      .map((fight) => fight.date)
      .filter((date): date is string => Boolean(date))
      .sort()[0]!;

    const id = eventId(slug, startsAt);
    const { data: eventRow, error: eventError } = await supabase
      .from("ufc_events")
      .upsert(
        {
          id,
          title: slug,
          date: startsAt,
          status: eventStatus(card),
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (eventError || !eventRow) {
      throw new Error(
        `Failed to upsert UFC event ${slug}: ${eventError?.message ?? "no row returned"}`,
      );
    }
    eventsUpserted += 1;

    const rows = card.map((fight, index) => {
      const status = mapStatus(fight.status);
      const result = resultForFight(results, fight.id);
      const round = resultRound(result);
      const time = resultTime(result);
      const side = winnerSide(fight, status);
      const winnerName =
        side === "a"
          ? fight.fighters!.first!.name!
          : side === "b"
            ? fight.fighters!.second!.name!
            : null;
      return {
        id: String(fight.id),
        event_id: eventRow.id,
        order_index: index + 1,
        weight_class: fight.category?.trim() || "Catchweight",
        fighter_a_name: fight.fighters!.first!.name!,
        fighter_a_image: fight.fighters?.first?.logo ?? null,
        fighter_b_name: fight.fighters!.second!.name!,
        fighter_b_image: fight.fighters?.second?.logo ?? null,
        winner_id: winnerName,
        method: side === "draw" ? "Draw" : resultMethod(result),
        details: round && time ? `R${round} ${time}` : round ? `R${round}` : null,
      };
    });

    const { error: fightsError } = await supabase
      .from("ufc_fights")
      .upsert(rows, { onConflict: "id" });

    if (fightsError) {
      throw new Error(
        `Failed to upsert UFC fights for ${slug}: ${fightsError.message}`,
      );
    }
    fightsUpserted += rows.length;

    const { data: existingFights, error: existingError } = await supabase
      .from("ufc_fights")
      .select("id")
      .eq("event_id", eventRow.id);

    if (existingError) {
      throw new Error(
        `Failed to load UFC fights for ${slug}: ${existingError.message}`,
      );
    }

    const kept = new Set(rows.map((row) => row.id));
    const staleIds = (existingFights ?? [])
      .filter((fight) => !kept.has(fight.id))
      .map((fight) => fight.id);

    if (staleIds.length > 0) {
      const { error: pruneError } = await supabase
        .from("ufc_fights")
        .delete()
        .in("id", staleIds);

      if (pruneError) {
        throw new Error(
          `Failed to prune UFC fights for ${slug}: ${pruneError.message}`,
        );
      }
    }
  }

  return { eventsUpserted, fightsUpserted };
}
