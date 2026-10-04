"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rateUfcFight } from "@/app/(app)/ufc/actions";
import { StarIcon } from "@/components/ratings/star-icon";
import {
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  STAR_COUNT,
  STAR_GOLD,
  STAR_OUTLINE,
  formatRating,
} from "@/lib/ratings";
import { cn } from "@/lib/utils";

type UfcFightStarsProps = {
  fightId: string;
  eventId: string;
  value: number | null;
};

export function UfcFightStars({ fightId, eventId, value }: UfcFightStarsProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [committed, setCommitted] = useState<number | null>(value);
  const shown = preview ?? committed ?? 0;

  useEffect(() => {
    setCommitted(value);
  }, [value]);

  function submit(rating: number) {
    if (isPending) {
      return;
    }

    const previous = committed;
    setError(null);
    setCommitted(rating);
    startTransition(async () => {
      const result = await rateUfcFight(fightId, eventId, rating);
      if (!result.ok) {
        setCommitted(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setPreview(null)}
      >
        <div className="flex" aria-label="Your rating">
          {Array.from({ length: STAR_COUNT }, (_, index) => {
            const star = index + 1;
            const half = star - 0.5;
            const hovered =
              preview != null && preview > index && preview <= star;
            return (
              <span
                key={star}
                className={cn(
                  "relative transition-transform duration-200 ease-out motion-reduce:transition-none",
                  hovered && "z-10 scale-110",
                )}
              >
                <StarIcon
                  size={16}
                  fill={shown - index}
                  fillColor={STAR_GOLD}
                  emptyColor={STAR_OUTLINE}
                  interactive
                />
                <span className="absolute inset-0 flex">
                  <button
                    type="button"
                    aria-label={`Rate ${formatRating(half)} stars`}
                    className="h-full w-1/2 cursor-pointer"
                    onMouseEnter={() => setPreview(half)}
                    onClick={() => submit(half)}
                  />
                  <button
                    type="button"
                    aria-label={`Rate ${formatRating(star)} stars`}
                    className="h-full w-1/2 cursor-pointer"
                    onMouseEnter={() => setPreview(star)}
                    onClick={() => submit(star)}
                  />
                </span>
              </span>
            );
          })}
        </div>
        <span className="w-7 text-right text-xs font-semibold tabular-nums text-[#D97706] transition-colors duration-200">
          {shown > 0 ? formatRating(shown) : ""}
        </span>
      </div>
      {error ? <p className="text-[11px] text-red-700">{error}</p> : null}
      <span className="sr-only">
        Ratings run from {RATING_MIN} to {RATING_MAX} in steps of {RATING_STEP}.
      </span>
    </div>
  );
}
