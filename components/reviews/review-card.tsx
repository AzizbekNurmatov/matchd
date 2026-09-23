"use client";

import { useState } from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { StarDisplay } from "@/components/ratings/star-display";
import { ReviewForm } from "@/components/reviews/review-form";
import type { ReviewItem } from "@/components/reviews/types";
import { UserAvatar } from "@/components/ui/user-avatar";
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

  return (
    <article className="flex items-start gap-3">
      <UserAvatar
        size="sm"
        src={review.author.avatarUrl}
        username={review.author.username}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <ReviewMeta review={review} edited={edited} />
          {isOwn && !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 text-sm text-[#8e8e8e] hover:text-[#f4f4f0]"
            >
              Edit
            </button>
          ) : null}
        </div>
        {editing ? (
          <div className="mt-4">
            <ReviewForm
              matchId={matchId}
              existingBody={review.body}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#f3efe6]">
            {review.body}
          </p>
        )}
      </div>
    </article>
  );
}

function ReviewMeta({
  review,
  edited,
}: {
  review: ReviewItem;
  edited: boolean;
}) {
  const author = review.author;
  const countryName = getCountryName(author.countryCode);
  const clubName = author.favoriteTeam?.short_name;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href={`/users/${author.username}`}
          className="font-medium text-[#f4f4f0] hover:text-[#e4b42a]"
        >
          {author.username}
        </Link>
        <CountryFlag
          code={author.countryCode}
          title={countryName ?? undefined}
          className="h-3 w-4 rounded-xs"
        />
        {author.favoriteTeam?.crest_url ? (
          <span className="inline-flex items-center gap-1 border border-[#242426] bg-[#151516] px-1.5 py-0.5">
            <img
              src={author.favoriteTeam.crest_url}
              alt={clubName ? `${clubName} supporter` : "Favorite club"}
              title={clubName ?? "Favorite club"}
              className="h-3.5 w-3.5 object-contain"
            />
            {clubName ? (
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#8c887b]">
                {clubName}
              </span>
            ) : null}
          </span>
        ) : null}
        {review.rating != null ? (
          <StarDisplay value={review.rating} size={14} />
        ) : null}
      </div>
      <p className="mt-0.5 font-mono text-xs text-[#8c887b]">
        {formatRelativeTime(review.createdAt)}
        {edited ? " · Edited" : null}
      </p>
    </div>
  );
}
