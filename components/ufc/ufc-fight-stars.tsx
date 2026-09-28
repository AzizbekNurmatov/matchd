"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rateUfcFight } from "@/app/(app)/ufc/actions";
import { StarIcon } from "@/components/ratings/star-icon";
import {
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  STAR_COUNT,
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
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const shown = preview ?? optimisticValue ?? 0;

  function submit(rating: number) {
    if (isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      setOptimisticValue(rating);
      const result = await rateUfcFight(fightId, eventId, rating);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div
        className={cn(
          "flex items-center gap-1",
          isPending && "pointer-events-none opacity-70",
        )}
        onMouseLeave={() => setPreview(null)}
      >
        <div className="flex" aria-label="Your rating">
          {Array.from({ length: STAR_COUNT }, (_, index) => {
            const star = index + 1;
            const half = star - 0.5;
            return (
              <span key={star} className="relative">
                <StarIcon size={16} fill={shown - index} />
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
        <span className="w-7 text-right text-xs font-semibold tabular-nums text-[#B45309]">
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
