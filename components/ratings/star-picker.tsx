"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rateMatch } from "@/app/(app)/matches/[id]/actions";
import { StarIcon } from "@/components/ratings/star-icon";
import {
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  STAR_COUNT,
  formatRating,
} from "@/lib/ratings";
import { cn } from "@/lib/utils";

type StarPickerProps = {
  matchId: string;
  value: number | null;
};

export function StarPicker({ matchId, value }: StarPickerProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);

  const selected = optimisticValue;
  const shown = preview ?? selected ?? 0;

  function submit(rating: number) {
    if (isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      setOptimisticValue(rating);
      const result = await rateMatch(matchId, rating);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function nudge(delta: number) {
    const base = selected ?? (delta > 0 ? 0 : RATING_MIN);
    const next = Math.min(RATING_MAX, Math.max(RATING_MIN, base + delta));
    submit(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex items-center gap-3",
          isPending && "pointer-events-none opacity-70",
        )}
        onMouseLeave={() => setPreview(null)}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Your rating"
          aria-valuemin={RATING_MIN}
          aria-valuemax={RATING_MAX}
          aria-valuenow={selected ?? undefined}
          aria-valuetext={
            selected ? `${formatRating(selected)} stars` : "No rating"
          }
          className="flex gap-0.5 outline-none focus-visible:ring-1 focus-visible:ring-accent"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              nudge(RATING_STEP);
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              nudge(-RATING_STEP);
            }
            if (event.key === "Home") {
              event.preventDefault();
              submit(RATING_MIN);
            }
            if (event.key === "End") {
              event.preventDefault();
              submit(RATING_MAX);
            }
          }}
        >
          {Array.from({ length: STAR_COUNT }, (_, index) => {
            const star = index + 1;
            const half = star - 0.5;

            return (
              <span key={star} className="relative">
                <StarIcon size={32} fill={shown - index} />
                <span className="absolute inset-0 flex">
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Rate ${formatRating(half)} stars`}
                    className="h-full w-1/2 cursor-pointer"
                    onMouseEnter={() => setPreview(half)}
                    onFocus={() => setPreview(half)}
                    onClick={() => submit(half)}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Rate ${formatRating(star)} stars`}
                    className="h-full w-1/2 cursor-pointer"
                    onMouseEnter={() => setPreview(star)}
                    onFocus={() => setPreview(star)}
                    onClick={() => submit(star)}
                  />
                </span>
              </span>
            );
          })}
        </div>
        <p className="min-w-[2.5rem] font-serif text-2xl tracking-tight text-[#e4b42a]">
          {shown > 0 ? formatRating(shown) : "–"}
        </p>
      </div>
      <p className="text-sm text-muted">
        {preview
          ? `Rate ${formatRating(preview)}`
          : selected
            ? `You rated this ${formatRating(selected)} · hover to change`
            : "Rate this match"}
      </p>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
