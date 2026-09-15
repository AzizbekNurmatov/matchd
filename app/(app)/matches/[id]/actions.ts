"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidRating } from "@/lib/ratings";

export type RateMatchResult =
  | { ok: true }
  | { ok: false; error: string };

export async function rateMatch(
  matchId: string,
  rating: number,
): Promise<RateMatchResult> {
  if (!isValidRating(rating)) {
    return {
      ok: false,
      error: "Ratings must be between 0.5 and 5 in half-star steps.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to log in to rate a match." };
  }

  const { error } = await supabase.from("match_ratings").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      rating,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}
