"use client";

import { useState } from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { StarDisplay } from "@/components/ratings/star-display";
import { ReviewForm } from "@/components/reviews/review-form";
import type { ReviewItem } from "@/components/reviews/types";
import { formatRelativeTime } from "@/lib/dates";
import { getCountryName } from "@/lib/utils/countries";

type ReviewCardProps = {
  review: ReviewItem;
  matchId: string;
  isOwn: boolean;
};

export function ReviewCard({ review, matchId, isOwn }: ReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const edited =
    new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() >
    60_000;

  if (editing) {
    return (
      <article>
        <ReviewHeader review={review} edited={edited} />
        <div className="mt-4">
          <ReviewForm
            matchId={matchId}
            existingBody={review.body}
            onCancel={() => setEditing(false)}
          />
        </div>
      </article>
    );
  }

  return (
    <article>
      <div className="flex items-start justify-between gap-4">
        <ReviewHeader review={review} edited={edited} />
        {isOwn ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-sm text-[#8e8e8e] hover:text-[#f4f4f0]"
          >
            Edit
          </button>
        ) : null}
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#f4f4f0]">
        {review.body}
      </p>
    </article>
  );
}

function ReviewHeader({
  review,
  edited,
}: {
  review: ReviewItem;
  edited: boolean;
}) {
  const countryName = getCountryName(review.countryCode);
  const clubName = review.favoriteTeam?.short_name;

  return (
    <header className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href={`/users/${review.username}`}
          className="font-medium text-[#f4f4f0] hover:text-[#e4b42a]"
        >
          {review.username}
        </Link>
        {review.countryCode || review.favoriteTeam?.crest_url ? (
          <span className="inline-flex items-center gap-1.5">
            <CountryFlag
              code={review.countryCode}
              title={countryName ?? undefined}
              className="h-3 w-4 rounded-xs"
            />
            {review.favoriteTeam?.crest_url ? (
              <img
                src={review.favoriteTeam.crest_url}
                alt={clubName ? `${clubName} supporter` : "Favorite club"}
                title={clubName ?? "Favorite club"}
                className="h-4 w-4 object-contain"
              />
            ) : null}
          </span>
        ) : null}
        {review.rating != null ? (
          <StarDisplay value={review.rating} size={14} />
        ) : null}
      </div>
      <p className="mt-1 text-xs text-[#8e8e8e]">
        {formatRelativeTime(review.createdAt)}
        {edited ? " · Edited" : null}
      </p>
    </header>
  );
}
