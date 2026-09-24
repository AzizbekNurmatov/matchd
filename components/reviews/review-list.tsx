import { ReviewCard } from "@/components/reviews/review-card";
import type { ReviewItem } from "@/components/reviews/types";

type ReviewListProps = {
  reviews: ReviewItem[];
  matchId: string;
  currentUserId: string | null;
};

export function ReviewList({
  reviews,
  matchId,
  currentUserId,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[#475569]">
        No reviews yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border">
      {reviews.map((review) => (
        <li key={review.id} className="py-8 first:pt-0 last:pb-0">
          <ReviewCard
            review={review}
            matchId={matchId}
            isOwn={review.userId === currentUserId}
          />
        </li>
      ))}
    </ol>
  );
}
