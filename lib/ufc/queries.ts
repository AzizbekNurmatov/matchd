import type { ReviewItem } from "@/components/reviews/types";
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

export async function listUfcEvents(): Promise<UfcEventCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ufc_events")
    .select("*, ufc_fights(*)")
    .order("date", { ascending: false })
    .order("order_index", { ascending: false, foreignTable: "ufc_fights" });

  if (error || !data) {
    if (error) {
      console.error("Error listing UFC events:", error.message);
    }
    return [];
  }

  const fightIds = data.flatMap((event) =>
    (event.ufc_fights ?? []).map((fight) => fight.id),
  );
  const ratings = await loadUserRatings(supabase, fightIds);

  return data.map((event) => {
    const fights = [...(event.ufc_fights ?? [])].sort(
      (a, b) => b.order_index - a.order_index,
    );
    return {
      id: event.id,
      name: event.title,
      startsAt: event.date,
      status: event.status ?? "UPCOMING",
      fights: fights.map((fight) => toFightCard(fight, ratings)),
    };
  });
}

export type UfcBoutReview = ReviewItem & { fightId: string };

export async function getUfcEventReviews(
  fightIds: string[],
): Promise<UfcBoutReview[]> {
  if (fightIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ufc_fight_ratings")
    .select("id, fight_id, user_id, rating, review, created_at")
    .in("fight_id", fightIds)
    .not("review", "is", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      console.error("Error fetching UFC reviews:", error.message);
    }
    return [];
  }

  const userIds = [
    ...new Set(data.map((row) => row.user_id).filter((id): id is string => Boolean(id))),
  ];
  const authors = new Map<
    string,
    ReviewItem["author"] & { id: string }
  >();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "id, username, avatar_url, country_code, favorite_team:teams!profiles_favorite_team_id_fkey(short_name, crest_url)",
      )
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      const team = Array.isArray(profile.favorite_team)
        ? profile.favorite_team[0]
        : profile.favorite_team;
      authors.set(profile.id, {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        countryCode: profile.country_code,
        favoriteTeam: team
          ? { crest_url: team.crest_url, short_name: team.short_name }
          : null,
      });
    }
  }

  return data.flatMap((row) => {
    if (!row.fight_id || !row.user_id || !row.review) {
      return [];
    }
    const author = authors.get(row.user_id);
    if (!author) {
      return [];
    }
    return [
      {
        id: row.id,
        fightId: row.fight_id,
        userId: row.user_id,
        author,
        body: row.review,
        createdAt: row.created_at,
        updatedAt: row.created_at,
        rating: toRatingNumber(row.rating),
      },
    ];
  });
}
