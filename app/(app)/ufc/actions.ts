"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidRating } from "@/lib/ratings";
import {
  normalizeReviewContent,
  validateReviewContent,
} from "@/lib/reviews";

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
  revalidatePath("/fights");
  revalidatePath(`/ufc/${eventId}`);
  return { ok: true };
}

export async function upsertUfcReview(
  eventId: string,
  content: string,
): Promise<RateUfcFightResult> {
  const errorMessage = validateReviewContent(content);
  if (errorMessage) {
    return { ok: false, error: errorMessage };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Log in to write a review." };
  }

  const review = normalizeReviewContent(content);
  const { data: existing, error: lookupError } = await supabase
    .from("ufc_fight_ratings")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .is("fight_id", null)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: lookupError.message };
  }

  const { error } = existing
    ? await supabase
        .from("ufc_fight_ratings")
        .update({ review })
        .eq("id", existing.id)
    : await supabase.from("ufc_fight_ratings").insert({
        user_id: user.id,
        event_id: eventId,
        review,
      });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/fights");
  revalidatePath(`/ufc/${eventId}`);
  return { ok: true };
}

export async function deleteUfcReview(
  eventId: string,
): Promise<RateUfcFightResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Log in to delete a review." };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("ufc_fight_ratings")
    .select("id, rating")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .is("fight_id", null)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: lookupError.message };
  }

  if (!existing) {
    return { ok: true };
  }

  const { error } =
    existing.rating == null
      ? await supabase.from("ufc_fight_ratings").delete().eq("id", existing.id)
      : await supabase
          .from("ufc_fight_ratings")
          .update({ review: null })
          .eq("id", existing.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/fights");
  revalidatePath(`/ufc/${eventId}`);
  return { ok: true };
}
