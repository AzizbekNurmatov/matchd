import { ReviewCard } from "@/components/reviews/review-card";
import type { ReviewItem } from "@/components/reviews/types";

type ReviewActionResult = { ok: true } | { ok: false; error: string };

type ReviewListProps = {
  reviews: ReviewItem[];
  matchId: string;
  currentUserId: string | null;
  onSave?: (body: string) => Promise<ReviewActionResult>;
  onDelete?: () => Promise<ReviewActionResult>;
  tone?: "light" | "dark";
};

export function ReviewList({
  reviews,
  matchId,
  currentUserId,
  onSave,
  onDelete,
  tone = "light",
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className={tone === "dark" ? "text-sm text-slate-400" : "text-sm text-[#475569]"}>
        No reviews yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <ol
      className={
        tone === "dark"
          ? "flex flex-col divide-y divide-slate-800"
          : "flex flex-col divide-y divide-border"
      }
    >
      {reviews.map((review) => (
        <li key={review.id} className="py-8 first:pt-0 last:pb-0">
          <ReviewCard
            review={review}
            matchId={matchId}
            isOwn={review.userId === currentUserId}
            onSave={onSave}
            onDelete={onDelete}
            tone={tone}
          />
        </li>
      ))}
    </ol>
  );
}
