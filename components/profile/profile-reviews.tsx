import { MatchStrip } from "@/components/profile/match-strip";
import type { ProfileReviewItem } from "@/components/profile/types";
import { StarDisplay } from "@/components/ratings/star-display";
import { formatRelativeTime } from "@/lib/dates";

type ProfileReviewsProps = {
  username: string;
  reviews: ProfileReviewItem[];
};

export function ProfileReviews({ username, reviews }: ProfileReviewsProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[#8e8e8e]">
        {username} hasn&apos;t written any reviews yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border">
      {reviews.map((review) => {
        const edited =
          new Date(review.updatedAt).getTime() -
            new Date(review.createdAt).getTime() >
          60_000;

        return (
          <li key={review.id} className="py-8 first:pt-0 last:pb-0">
            <article>
              <p className="text-xs text-[#8e8e8e]">
                {review.match.competitionName ?? "Match"}
              </p>
              <div className="mt-3">
                <MatchStrip
                  match={review.match}
                  href={`/matches/${review.match.id}`}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {review.rating != null ? (
                  <StarDisplay value={review.rating} size={14} />
                ) : null}
                <p className="text-xs text-[#8e8e8e]">
                  {formatRelativeTime(review.createdAt)}
                  {edited ? " · Edited" : null}
                </p>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#f4f4f0]">
                {review.body}
              </p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
