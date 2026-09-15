"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidRating } from "@/lib/ratings";
import {
  normalizeReviewContent,
  validateReviewContent,
} from "@/lib/reviews";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type RateMatchResult = ActionResult;

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

export async function upsertReview(
  matchId: string,
  content: string,
): Promise<ActionResult> {
  const errorMessage = validateReviewContent(content);
  if (errorMessage) {
    return { ok: false, error: errorMessage };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to log in to write a review." };
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      body: normalizeReviewContent(content),
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}

export async function deleteReview(matchId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to log in to delete a review." };
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", user.id)
    .eq("match_id", matchId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}
