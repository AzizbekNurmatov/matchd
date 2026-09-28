import { toRatingNumber } from "@/lib/ratings";
import { createClient } from "@/lib/supabase/server";

const MS_PER_DAY = 86_400_000;
const FIGHT_WEEK_BEFORE_DAYS = 7;
const FIGHT_WEEK_AFTER_DAYS = 1;

export type UfcFightCard = {
  id: string;
  orderIndex: number;
  weightClass: string | null;
  fighterAName: string;
  fighterAImageUrl: string | null;
  fighterBName: string;
  fighterBImageUrl: string | null;
  winnerName: string | null;
  method: string | null;
  details: string | null;
  userRating: number | null;
};

export type UfcEventCardData = {
  id: string;
  name: string;
  startsAt: string;
  status: string;
  fights: UfcFightCard[];
};

export async function getFightWeekEvent(): Promise<UfcEventCardData | null> {
  const supabase = await createClient();
  const now = Date.now();
  const from = new Date(now - FIGHT_WEEK_AFTER_DAYS * MS_PER_DAY).toISOString();
  const to = new Date(now + FIGHT_WEEK_BEFORE_DAYS * MS_PER_DAY).toISOString();

  const { data: events, error } = await supabase
    .from("ufc_events")
    .select("id, title, date, status")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (error || !events || events.length === 0) {
    if (error) {
      console.error("Error fetching UFC fight week:", error.message);
    }
    return null;
  }

  const upcoming = events.find((event) => new Date(event.date).getTime() >= now);
  const event = upcoming ?? events[events.length - 1];
  if (!event) {
    return null;
  }

  return loadEventCard(event.id);
}

export async function getUfcEvent(eventId: string): Promise<UfcEventCardData | null> {
  return loadEventCard(eventId);
}

async function loadEventCard(eventId: string): Promise<UfcEventCardData | null> {
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("ufc_events")
    .select("id, title, date, status")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    if (error) {
      console.error("Error fetching UFC event:", error.message);
    }
    return null;
  }

  const { data: fights, error: fightsError } = await supabase
    .from("ufc_fights")
    .select(
      "id, order_index, weight_class, fighter_a_name, fighter_a_image, fighter_b_name, fighter_b_image, winner_id, method, details",
    )
    .eq("event_id", event.id)
    .order("order_index", { ascending: false });

  if (fightsError || !fights) {
    if (fightsError) {
      console.error("Error fetching UFC fights:", fightsError.message);
    }
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ratings = new Map<string, number>();
  if (user && fights.length > 0) {
    const { data: ratingRows } = await supabase
      .from("ufc_fight_ratings")
      .select("fight_id, rating")
      .eq("user_id", user.id)
      .in(
        "fight_id",
        fights.map((fight) => fight.id),
      );

    for (const row of ratingRows ?? []) {
      if (!row.fight_id) {
        continue;
      }
      const value = toRatingNumber(row.rating);
      if (value != null) {
        ratings.set(row.fight_id, value);
      }
    }
  }

  return {
    id: event.id,
    name: event.title,
    startsAt: event.date,
    status: event.status ?? "UPCOMING",
    fights: fights.map((fight) => ({
      id: fight.id,
      orderIndex: fight.order_index,
      weightClass: fight.weight_class,
      fighterAName: fight.fighter_a_name,
      fighterAImageUrl: fight.fighter_a_image,
      fighterBName: fight.fighter_b_name,
      fighterBImageUrl: fight.fighter_b_image,
      winnerName: fight.winner_id,
      method: fight.method,
      details: fight.details,
      userRating: ratings.get(fight.id) ?? null,
    })),
  };
}
