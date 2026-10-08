"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidRating } from "@/lib/ratings";

export type RateF1RaceResult = { ok: true } | { ok: false; error: string };

export async function rateF1Race(
  raceId: string,
  rating: number,
): Promise<RateF1RaceResult> {
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
    return { ok: false, error: "Log in to rate this Grand Prix." };
  }

  const { error } = await supabase.from("f1_race_ratings").upsert(
    {
      user_id: user.id,
      race_id: raceId,
      rating,
    },
    { onConflict: "user_id,race_id" },
  );

  if (error) {
    if (/f1_race_ratings|schema cache|does not exist/i.test(error.message)) {
      return {
        ok: false,
        error: "Grand Prix ratings are not available until the F1 tables are migrated.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/f1");
  revalidatePath("/search");
  return { ok: true };
}
