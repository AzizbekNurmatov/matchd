import { toRatingNumber } from "@/lib/ratings";
import { createClient } from "@/lib/supabase/server";

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

export async function getLatestUfcEvent(): Promise<UfcEventCardData | null> {
  const supabase = await createClient();
  const { data: ufcEvent, error } = await supabase
    .from("ufc_events")
    .select("*, ufc_fights(*)")
    .order("date", { ascending: false })
    .order("order_index", { ascending: false, foreignTable: "ufc_fights" })
    .limit(1)
    .maybeSingle();

  if (error || !ufcEvent) {
    if (error) {
      console.error("Error fetching latest UFC event:", error.message);
    }
    return null;
  }

  const fights = [...(ufcEvent.ufc_fights ?? [])].sort(
    (a, b) => b.order_index - a.order_index,
  );
  const ratings = await loadUserRatings(
    supabase,
    fights.map((fight) => fight.id),
  );

  return {
    id: ufcEvent.id,
    name: ufcEvent.title,
    startsAt: ufcEvent.date,
    status: ufcEvent.status ?? "UPCOMING",
    fights: fights.map((fight) => toFightCard(fight, ratings)),
  };
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

  const ratings = await loadUserRatings(
    supabase,
    fights.map((fight) => fight.id),
  );

  return {
    id: event.id,
    name: event.title,
    startsAt: event.date,
    status: event.status ?? "UPCOMING",
    fights: fights.map((fight) => toFightCard(fight, ratings)),
  };
}

type FightRow = {
  id: string;
  order_index: number;
  weight_class: string | null;
  fighter_a_name: string;
  fighter_a_image: string | null;
  fighter_b_name: string;
  fighter_b_image: string | null;
  winner_id: string | null;
  method: string | null;
  details: string | null;
};

function toFightCard(fight: FightRow, ratings: Map<string, number>): UfcFightCard {
  return {
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
  };
}

async function loadUserRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fightIds: string[],
) {
  const ratings = new Map<string, number>();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || fightIds.length === 0) {
    return ratings;
  }

  const { data: ratingRows } = await supabase
    .from("ufc_fight_ratings")
    .select("fight_id, rating")
    .eq("user_id", user.id)
    .in("fight_id", fightIds);

  for (const row of ratingRows ?? []) {
    if (!row.fight_id) {
      continue;
    }
    const value = toRatingNumber(row.rating);
    if (value != null) {
      ratings.set(row.fight_id, value);
    }
  }

  return ratings;
}
