"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidRating } from "@/lib/ratings";

export type RateUfcFightResult =
  | { ok: true }
  | { ok: false; error: string };

export async function rateUfcFight(
  fightId: string,
  eventId: string,
  rating: number,
): Promise<RateUfcFightResult> {
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
    return { ok: false, error: "Log in to rate this fight." };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("ufc_fight_ratings")
    .select("id")
    .eq("user_id", user.id)
    .eq("fight_id", fightId)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: lookupError.message };
  }

  const { error } = existing
    ? await supabase
        .from("ufc_fight_ratings")
        .update({ rating })
        .eq("id", existing.id)
    : await supabase.from("ufc_fight_ratings").insert({
        user_id: user.id,
        fight_id: fightId,
        rating,
      });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/ufc/${eventId}`);
  return { ok: true };
}
