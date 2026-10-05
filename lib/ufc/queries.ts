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
  venue: string | null;
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
    venue: ufcEvent.venue,
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
    .select("id, title, date, status, venue")
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
    venue: event.venue,
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

export type FighterSearchHit = {
  name: string;
  imageUrl: string | null;
  events: UfcEventCardData[];
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
      venue: event.venue,
      fights: fights.map((fight) => toFightCard(fight, ratings)),
    };
  });
}

export async function getUfcEventReviews(eventId: string): Promise<ReviewItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ufc_fight_ratings")
    .select("id, event_id, user_id, rating, review, created_at")
    .eq("event_id", eventId)
    .is("fight_id", null)
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
    if (!row.user_id || !row.review) {
      return [];
    }
    const author = authors.get(row.user_id);
    if (!author) {
      return [];
    }
    return [
      {
        id: row.id,
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

const FIGHT_SEARCH_SELECT =
  "id, order_index, weight_class, fighter_a_name, fighter_a_image, fighter_b_name, fighter_b_image, winner_id, method, details, event:ufc_events(id, title, date, status, venue)";

type EventEmbed = {
  id: string;
  title: string;
  date: string;
  status: string | null;
  venue: string | null;
};

type FightSearchRow = FightRow & {
  event: EventEmbed | EventEmbed[] | null;
};

export async function searchUfcCatalog(query: string): Promise<{
  fighters: FighterSearchHit[];
  events: UfcEventCardData[];
}> {
  const term = query.trim();
  const safe = term.replace(/[%_\\]/g, "");
  if (!safe) {
    return { fighters: [], events: [] };
  }

  const pattern = `%${safe}%`;
  const supabase = await createClient();
  const [eventsResult, sideA, sideB] = await Promise.all([
    supabase
      .from("ufc_events")
      .select("*, ufc_fights(*)")
      .ilike("title", pattern)
      .order("date", { ascending: false })
      .limit(4),
    supabase
      .from("ufc_fights")
      .select(FIGHT_SEARCH_SELECT)
      .ilike("fighter_a_name", pattern)
      .limit(40),
    supabase
      .from("ufc_fights")
      .select(FIGHT_SEARCH_SELECT)
      .ilike("fighter_b_name", pattern)
      .limit(40),
  ]);

  if (eventsResult.error) {
    console.error("Error searching UFC events:", eventsResult.error.message);
  }
  if (sideA.error) {
    console.error("Error searching fighters:", sideA.error.message);
  }
  if (sideB.error) {
    console.error("Error searching fighters:", sideB.error.message);
  }

  const eventRows = eventsResult.data ?? [];
  const fightRows = dedupeFightRows([
    ...((sideA.data ?? []) as FightSearchRow[]),
    ...((sideB.data ?? []) as FightSearchRow[]),
  ]);
  const ratings = await loadUserRatings(supabase, [
    ...eventRows.flatMap((event) =>
      (event.ufc_fights ?? []).map((fight) => fight.id),
    ),
    ...fightRows.map((fight) => fight.id),
  ]);

  return {
    fighters: groupFighterHits(fightRows, safe, ratings),
    events: eventRows.map((event) =>
      toEventCard(event, event.ufc_fights ?? [], ratings),
    ),
  };
}

function dedupeFightRows(rows: FightSearchRow[]) {
  const byId = new Map<string, FightSearchRow>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return [...byId.values()];
}

function groupFighterHits(
  rows: FightSearchRow[],
  query: string,
  ratings: Map<string, number>,
): FighterSearchHit[] {
  const needle = query.trim().toLowerCase();
  const byFighter = new Map<
    string,
    {
      name: string;
      imageUrl: string | null;
      byEvent: Map<string, { event: EventEmbed; fights: FightRow[] }>;
    }
  >();

  for (const row of rows) {
    considerFighter(byFighter, row, "a", needle);
    considerFighter(byFighter, row, "b", needle);
  }

  return [...byFighter.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 6)
    .map((fighter) => ({
      name: fighter.name,
      imageUrl: fighter.imageUrl,
      events: [...fighter.byEvent.values()]
        .sort(
          (a, b) =>
            new Date(b.event.date).getTime() - new Date(a.event.date).getTime(),
        )
        .slice(0, 3)
        .map(({ event, fights }) => toEventCard(event, fights, ratings)),
    }));
}

function considerFighter(
  byFighter: Map<
    string,
    {
      name: string;
      imageUrl: string | null;
      byEvent: Map<string, { event: EventEmbed; fights: FightRow[] }>;
    }
  >,
  row: FightSearchRow,
  side: "a" | "b",
  needle: string,
) {
  const name = side === "a" ? row.fighter_a_name : row.fighter_b_name;
  const image = side === "a" ? row.fighter_a_image : row.fighter_b_image;
  if (!name.toLowerCase().includes(needle)) {
    return;
  }

  const event = asSingle(row.event);
  if (!event) {
    return;
  }

  const key = name.trim().toLowerCase();
  let fighter = byFighter.get(key);
  if (!fighter) {
    fighter = {
      name: name.trim(),
      imageUrl: image,
      byEvent: new Map(),
    };
    byFighter.set(key, fighter);
  } else if (!fighter.imageUrl && image) {
    fighter.imageUrl = image;
  }

  let bucket = fighter.byEvent.get(event.id);
  if (!bucket) {
    bucket = { event, fights: [] };
    fighter.byEvent.set(event.id, bucket);
  }
  if (!bucket.fights.some((fight) => fight.id === row.id)) {
    bucket.fights.push(row);
  }
}

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toEventCard(
  event: {
    id: string;
    title: string;
    date: string;
    status: string | null;
    venue: string | null;
  },
  fights: FightRow[],
  ratings: Map<string, number>,
): UfcEventCardData {
  const ordered = [...fights].sort((a, b) => b.order_index - a.order_index);
  return {
    id: event.id,
    name: event.title,
    startsAt: event.date,
    status: event.status ?? "UPCOMING",
    venue: event.venue,
    fights: ordered.map((fight) => toFightCard(fight, ratings)),
  };
}
